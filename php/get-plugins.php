<?php
/**
 * Magento 2 Plugin (Interceptor) Analysis Script
 *
 * Analyzes di.xml files across ALL scopes to find plugins for a given class.
 * When methodName is provided, analyzes that single method.
 * When omitted, scans all public methods of the class.
 *
 * Arguments:
 *   $argv[1] = magentoRoot
 *   $argv[2] = className
 *   $argv[3] = methodName (optional — omit to scan all public methods)
 *
 * Outputs JSON to stdout.
 */

if (!isset($argv[1]) || !isset($argv[2])) {
    fwrite(
        STDERR,
        "Usage: php get-plugins.php <magentoRoot> <className> [methodName]\n",
    );
    exit(1);
}

$magentoRoot = $argv[1];
$className = $argv[2];
$methodName = isset($argv[3]) ? $argv[3] : null;

require __DIR__ . "/bootstrap.php";

$warnings = [];

$allScopes = [
    "global",
    "adminhtml",
    "frontend",
    "crontab",
    "webapi_rest",
    "webapi_soap",
    "graphql",
];

// --- Step 1: Resolve class hierarchy ---
$classHierarchy = [ltrim($className, "\\")];
$classReflection = null;

try {
    $classReflection = new ReflectionClass($className);

    $parent = $classReflection->getParentClass();
    while ($parent) {
        $classHierarchy[] = $parent->getName();
        $parent = $parent->getParentClass();
    }

    foreach ($classReflection->getInterfaceNames() as $interface) {
        $classHierarchy[] = $interface;
    }
} catch (ReflectionException $e) {
    $warnings[] =
        "Could not reflect class '$className': " .
        $e->getMessage() .
        ". Analysis will use the literal class name only.";
}

$normalizedHierarchy = array_map(function ($cls) {
    return ltrim($cls, "\\");
}, $classHierarchy);

// --- Step 2: Determine methods to scan ---
if ($methodName !== null) {
    $methodsToScan = [$methodName];
} elseif ($classReflection !== null) {
    $methodsToScan = [];
    foreach ($classReflection->getMethods(ReflectionMethod::IS_PUBLIC) as $m) {
        $methodsToScan[] = $m->getName();
    }
    if (empty($methodsToScan)) {
        $warnings[] = "Class '$className' has no public methods.";
    }
} else {
    fwrite(
        STDERR,
        "Error: Cannot determine methods — class could not be reflected and no methodName provided.\n",
    );
    exit(1);
}

// --- Step 3: Parse global di.xml files once ---
$globalPlugins = parsePluginsFromFiles(
    collectDiXmlFiles($enabledModulePaths, $magentoRoot, "global"),
);

// --- Step 4: Collect area-specific di.xml files per scope ---
$areaDiFiles = [];
foreach ($allScopes as $scope) {
    if ($scope === "global") {
        continue;
    }
    $files = [];
    foreach ($enabledModulePaths as $moduleName => $modulePath) {
        $areaDi = $modulePath . "/etc/" . $scope . "/di.xml";
        if (file_exists($areaDi)) {
            $files[] = $areaDi;
        }
    }
    if (!empty($files)) {
        $areaDiFiles[$scope] = $files;
    }
}

// --- Step 5: Build per-scope effective plugin lists (filtered to hierarchy, before method check) ---
$perScopeMatchedPlugins = [];
foreach ($allScopes as $scope) {
    $effectivePlugins = $globalPlugins;

    if ($scope !== "global" && isset($areaDiFiles[$scope])) {
        $areaPlugins = parsePluginsFromFiles($areaDiFiles[$scope]);
        foreach ($areaPlugins as $key => $plugin) {
            $effectivePlugins[$key] = $plugin;
        }
    }

    // Remove disabled
    foreach ($effectivePlugins as $key => $plugin) {
        if ($plugin["disabled"] === "true" || $plugin["disabled"] === "1") {
            unset($effectivePlugins[$key]);
        }
    }

    // Filter to class hierarchy
    $matched = [];
    foreach ($effectivePlugins as $plugin) {
        $normalizedTarget = ltrim($plugin["targetType"], "\\");
        if (in_array($normalizedTarget, $normalizedHierarchy, true)) {
            $plugin["targetType"] = $normalizedTarget;
            $matched[] = $plugin;
        }
    }

    if (!empty($matched)) {
        $perScopeMatchedPlugins[$scope] = $matched;
    }
}

// --- Step 6: For each method, filter by before/around/after and build results ---
if ($methodName !== null) {
    // Single method mode — same output structure as before
    $scopeResults = analyzeMethod(
        $methodName,
        $perScopeMatchedPlugins,
        $className,
        $enabledModulePaths,
        $magentoRoot,
    );

    $totalPluginCount = 0;
    foreach ($scopeResults as $sr) {
        $totalPluginCount += $sr["pluginCount"];
    }

    $output = [
        "targetClass" => ltrim($className, "\\"),
        "targetMethod" => $methodName,
        "classHierarchy" => $normalizedHierarchy,
        "scopeResults" => $scopeResults,
        "totalPluginCount" => $totalPluginCount,
        "warnings" => $warnings,
    ];
} else {
    // All-methods mode
    $methodResults = [];
    $totalPluginCount = 0;

    foreach ($methodsToScan as $method) {
        $scopeResults = analyzeMethod(
            $method,
            $perScopeMatchedPlugins,
            $className,
            $enabledModulePaths,
            $magentoRoot,
        );

        if (!empty($scopeResults)) {
            $methodTotal = 0;
            foreach ($scopeResults as $sr) {
                $methodTotal += $sr["pluginCount"];
            }
            $methodResults[$method] = [
                "scopeResults" => $scopeResults,
                "totalPluginCount" => $methodTotal,
            ];
            $totalPluginCount += $methodTotal;
        }
    }

    $output = [
        "targetClass" => ltrim($className, "\\"),
        "targetMethod" => null,
        "classHierarchy" => $normalizedHierarchy,
        "methodResults" => $methodResults,
        "methodsChecked" => count($methodsToScan),
        "methodsWithPlugins" => count($methodResults),
        "totalPluginCount" => $totalPluginCount,
        "warnings" => $warnings,
    ];
}

echo json_encode($output, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

// =============================================================================
// Helper functions
// =============================================================================

/**
 * Analyze a single method across all scopes that have matched plugins.
 * Returns scopeResults array (only scopes with plugins).
 */
function analyzeMethod(
    string $methodName,
    array $perScopeMatchedPlugins,
    string $className,
    array $enabledModulePaths,
    string $magentoRoot,
): array {
    $ucfirstMethod = ucfirst($methodName);
    $scopeResults = [];

    foreach ($perScopeMatchedPlugins as $scope => $matchedPlugins) {
        $filteredPlugins = filterPluginsByMethod(
            $matchedPlugins,
            $ucfirstMethod,
            $enabledModulePaths,
            $magentoRoot,
        );

        if (empty($filteredPlugins)) {
            continue;
        }

        usort($filteredPlugins, function ($a, $b) {
            return $a["sortOrder"] - $b["sortOrder"];
        });

        foreach ($filteredPlugins as &$plugin) {
            $plugin["scope"] = $scope;
        }
        unset($plugin);

        $scopeResults[$scope] = [
            "plugins" => $filteredPlugins,
            "executionOrder" => buildExecutionOrder(
                $filteredPlugins,
                $className,
                $methodName,
            ),
            "pluginCount" => count($filteredPlugins),
        ];
    }

    return $scopeResults;
}

/**
 * Parse plugin declarations from a list of di.xml files.
 * Returns assoc array keyed by targetType::pluginName.
 */
function parsePluginsFromFiles(array $diFiles): array
{
    $plugins = [];

    foreach ($diFiles as $diFile) {
        $xml = @simplexml_load_file($diFile);
        if ($xml === false) {
            continue;
        }

        foreach ($xml->xpath("//type") as $typeNode) {
            $targetType = (string) $typeNode["name"];
            if (empty($targetType)) {
                continue;
            }

            foreach ($typeNode->plugin as $pluginNode) {
                $pluginName = (string) $pluginNode["name"];
                $pluginType = (string) $pluginNode["type"];
                $pluginSortOrder = isset($pluginNode["sortOrder"])
                    ? (int) $pluginNode["sortOrder"]
                    : 0;
                $pluginDisabled = (string) $pluginNode["disabled"];

                if (empty($pluginName)) {
                    continue;
                }

                $compositeKey = $targetType . "::" . $pluginName;

                if (isset($plugins[$compositeKey]) && empty($pluginType)) {
                    if ($pluginDisabled !== "") {
                        $plugins[$compositeKey]["disabled"] = $pluginDisabled;
                    }
                    if (isset($pluginNode["sortOrder"])) {
                        $plugins[$compositeKey]["sortOrder"] = $pluginSortOrder;
                    }
                    $plugins[$compositeKey]["sourceFile"] = $diFile;
                } else {
                    $plugins[$compositeKey] = [
                        "pluginName" => $pluginName,
                        "pluginType" =>
                            $pluginType ?:
                            (isset($plugins[$compositeKey])
                                ? $plugins[$compositeKey]["pluginType"]
                                : ""),
                        "targetType" => $targetType,
                        "sortOrder" => $pluginSortOrder,
                        "disabled" => $pluginDisabled,
                        "sourceFile" => $diFile,
                    ];
                }
            }
        }
    }

    return $plugins;
}

/**
 * Filter matched plugins to those that have at least one before/around/after method.
 */
function filterPluginsByMethod(
    array $matchedPlugins,
    string $ucfirstMethod,
    array $enabledModulePaths,
    string $magentoRoot,
): array {
    $pluginMethods = [
        "before" => "before" . $ucfirstMethod,
        "around" => "around" . $ucfirstMethod,
        "after" => "after" . $ucfirstMethod,
    ];

    $filtered = [];

    foreach ($matchedPlugins as $plugin) {
        $foundMethods = [];
        $reflectionError = null;

        if (!empty($plugin["pluginType"])) {
            try {
                $pluginReflection = new ReflectionClass($plugin["pluginType"]);
                foreach ($pluginMethods as $type => $methodNameCheck) {
                    if ($pluginReflection->hasMethod($methodNameCheck)) {
                        $foundMethods[$type] = $methodNameCheck;
                    }
                }
            } catch (ReflectionException $e) {
                $reflectionError =
                    "Could not reflect plugin class '{$plugin["pluginType"]}': " .
                    $e->getMessage();
                $foundMethods = $pluginMethods;
            }
        } else {
            $reflectionError = "Plugin '{$plugin["pluginName"]}' has no type specified";
            $foundMethods = $pluginMethods;
        }

        if (!empty($foundMethods)) {
            $plugin["methods"] = $foundMethods;
            if ($reflectionError) {
                $plugin["reflectionError"] = $reflectionError;
            }
            $plugin["module"] = determineModule(
                $plugin["sourceFile"],
                $enabledModulePaths,
                $magentoRoot,
            );
            $filtered[] = $plugin;
        }
    }

    return $filtered;
}

/**
 * Build the execution order for a set of sorted plugins.
 */
function buildExecutionOrder(
    array $plugins,
    string $className,
    string $methodName,
): array {
    $executionOrder = [];
    $beforeMethods = [];
    $aroundMethods = [];
    $afterMethods = [];

    foreach ($plugins as $plugin) {
        $entry = [
            "pluginName" => $plugin["pluginName"],
            "pluginType" => $plugin["pluginType"],
            "sortOrder" => $plugin["sortOrder"],
        ];
        if (isset($plugin["methods"]["before"])) {
            $beforeMethods[] = $entry + [
                "method" => $plugin["methods"]["before"],
            ];
        }
        if (isset($plugin["methods"]["around"])) {
            $aroundMethods[] = $entry + [
                "method" => $plugin["methods"]["around"],
            ];
        }
        if (isset($plugin["methods"]["after"])) {
            $afterMethods[] = $entry + [
                "method" => $plugin["methods"]["after"],
            ];
        }
    }

    foreach ($beforeMethods as $m) {
        $executionOrder[] = [
            "step" => "before",
            "pluginName" => $m["pluginName"],
            "class" => $m["pluginType"],
            "method" => $m["method"],
            "sortOrder" => $m["sortOrder"],
        ];
    }

    foreach ($aroundMethods as $m) {
        $executionOrder[] = [
            "step" => "around (entering)",
            "pluginName" => $m["pluginName"],
            "class" => $m["pluginType"],
            "method" => $m["method"],
            "sortOrder" => $m["sortOrder"],
        ];
    }

    $executionOrder[] = [
        "step" => "original",
        "pluginName" => null,
        "class" => $className,
        "method" => $methodName,
        "sortOrder" => null,
    ];

    foreach (array_reverse($aroundMethods) as $m) {
        $executionOrder[] = [
            "step" => "around (exiting)",
            "pluginName" => $m["pluginName"],
            "class" => $m["pluginType"],
            "method" => $m["method"],
            "sortOrder" => $m["sortOrder"],
        ];
    }

    foreach ($afterMethods as $m) {
        $executionOrder[] = [
            "step" => "after",
            "pluginName" => $m["pluginName"],
            "class" => $m["pluginType"],
            "method" => $m["method"],
            "sortOrder" => $m["sortOrder"],
        ];
    }

    return $executionOrder;
}

/**
 * Determine which module a di.xml file belongs to.
 */
function determineModule(
    string $diFile,
    array $modulePaths,
    string $magentoRoot,
): ?string {
    foreach ($modulePaths as $moduleName => $modulePath) {
        if (strpos($diFile, $modulePath . "/") === 0) {
            return $moduleName;
        }
    }

    if (strpos($diFile, $magentoRoot . "/app/etc/") === 0) {
        return "app/etc";
    }

    return null;
}
