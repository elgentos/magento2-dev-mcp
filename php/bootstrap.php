<?php
/**
 * Shared Magento 2 bootstrap for MCP PHP analysis scripts.
 *
 * Expects $magentoRoot to be set before inclusion.
 *
 * Provides:
 *   - $enabledModulePaths  (assoc array: module name => filesystem path)
 *   - collectDiXmlFiles(array $modulePaths, string $magentoRoot, string $scope): array
 */

if (!isset($magentoRoot) || !is_dir($magentoRoot)) {
    fwrite(STDERR, "Error: \$magentoRoot is not set or is not a valid directory.\n");
    exit(1);
}

$autoloadFile = $magentoRoot . '/vendor/autoload.php';
if (!file_exists($autoloadFile)) {
    fwrite(STDERR, "Error: Cannot find vendor/autoload.php in $magentoRoot\n");
    exit(1);
}

require $autoloadFile;

// Read module enable/disable status from app/etc/config.php
$configFile = $magentoRoot . '/app/etc/config.php';
if (!file_exists($configFile)) {
    fwrite(STDERR, "Error: Cannot find app/etc/config.php in $magentoRoot\n");
    exit(1);
}

$config = require $configFile;
$moduleStatuses = isset($config['modules']) ? $config['modules'] : [];

// Get module paths from ComponentRegistrar
$registrar = new \Magento\Framework\Component\ComponentRegistrar();
$allModulePaths = $registrar->getPaths(\Magento\Framework\Component\ComponentRegistrar::MODULE);

// Build enabled module paths
$enabledModulePaths = [];
foreach ($allModulePaths as $moduleName => $modulePath) {
    if (isset($moduleStatuses[$moduleName]) && $moduleStatuses[$moduleName] === 1) {
        $enabledModulePaths[$moduleName] = $modulePath;
    }
}

/**
 * Collect di.xml files for given modules and scope.
 *
 * @param array  $modulePaths  Assoc array: module name => filesystem path
 * @param string $magentoRoot  Magento root directory
 * @param string $scope        Scope: 'global', 'frontend', 'adminhtml', etc.
 * @return array  List of absolute paths to di.xml files
 */
function collectDiXmlFiles(array $modulePaths, string $magentoRoot, string $scope): array
{
    $files = [];

    foreach ($modulePaths as $moduleName => $modulePath) {
        // Global di.xml
        $globalDi = $modulePath . '/etc/di.xml';
        if (file_exists($globalDi)) {
            $files[] = $globalDi;
        }

        // Area-specific di.xml (only if scope is not 'global')
        if ($scope !== 'global') {
            $areaDi = $modulePath . '/etc/' . $scope . '/di.xml';
            if (file_exists($areaDi)) {
                $files[] = $areaDi;
            }
        }
    }

    // Also check app/etc/di.xml (Magento root-level DI config)
    $appDi = $magentoRoot . '/app/etc/di.xml';
    if (file_exists($appDi)) {
        $files[] = $appDi;
    }

    return $files;
}
