/**
 * Format a scope block for plugin display.
 */
function formatScopeBlock(scope: string, scopeData: any): string {
  let text = `\n  Scope: ${scope} (${scopeData.pluginCount} plugin${scopeData.pluginCount !== 1 ? 's' : ''})\n`;

  for (const plugin of scopeData.plugins) {
    text += `\n    [${plugin.pluginName}]\n`;
    text += `      Class: ${plugin.pluginType}\n`;
    text += `      Target: ${plugin.targetType}\n`;
    text += `      Sort Order: ${plugin.sortOrder}\n`;
    if (plugin.module) {
      text += `      Module: ${plugin.module}\n`;
    }
    text += `      Source: ${plugin.sourceFile}\n`;
    if (plugin.methods) {
      const methodNames = Object.values(plugin.methods as Record<string, string>);
      text += `      Methods: ${methodNames.join(', ')}\n`;
    }
    if (plugin.reflectionError) {
      text += `      ⚠ ${plugin.reflectionError}\n`;
    }
  }

  text += `\n    Execution order:\n`;
  let step = 1;
  for (const entry of scopeData.executionOrder) {
    if (entry.step === 'original') {
      text += `      ${step}. [ORIGINAL] ${entry.class}::${entry.method}()\n`;
    } else {
      text += `      ${step}. [${entry.step.toUpperCase()}] ${entry.pluginName} → ${entry.class}::${entry.method}() (sortOrder: ${entry.sortOrder})\n`;
    }
    step++;
  }

  return text;
}

/**
 * Format the full plugin analysis output for the dev-plugin-list tool.
 */
export function formatPluginAnalysis(data: any): string {
  let text = '';

  // Single-method mode
  if (data.targetMethod) {
    text += `=== Plugin Analysis ===\n`;
    text += `Target: ${data.targetClass}::${data.targetMethod}()\n`;
    text += `Total plugins found: ${data.totalPluginCount}\n`;

    const scopeNames = Object.keys(data.scopeResults || {});
    text += `Scopes with plugins: ${scopeNames.length > 0 ? scopeNames.join(', ') : 'none'}\n`;

    text += `\nClass hierarchy:\n`;
    for (const cls of data.classHierarchy) {
      text += `  - ${cls}\n`;
    }

    if (data.warnings && data.warnings.length > 0) {
      text += `\nWarnings:\n`;
      for (const warning of data.warnings) {
        text += `  ⚠ ${warning}\n`;
      }
    }

    if (scopeNames.length > 0) {
      for (const scope of scopeNames) {
        const scopeData = data.scopeResults[scope];
        text += formatScopeBlock(scope, scopeData);
      }
    } else {
      text += `\nNo plugins found for ${data.targetClass}::${data.targetMethod}() in any scope.\n`;
    }
  } else {
    // All-methods mode
    text += `=== Plugin Analysis (all methods) ===\n`;
    text += `Target class: ${data.targetClass}\n`;
    text += `Methods checked: ${data.methodsChecked}\n`;
    text += `Methods with plugins: ${data.methodsWithPlugins}\n`;
    text += `Total plugin instances: ${data.totalPluginCount}\n`;

    text += `\nClass hierarchy:\n`;
    for (const cls of data.classHierarchy) {
      text += `  - ${cls}\n`;
    }

    if (data.warnings && data.warnings.length > 0) {
      text += `\nWarnings:\n`;
      for (const warning of data.warnings) {
        text += `  ⚠ ${warning}\n`;
      }
    }

    const methodNames = Object.keys(data.methodResults || {});
    if (methodNames.length > 0) {
      for (const method of methodNames) {
        const methodData = data.methodResults[method];
        text += `\n--- ${data.targetClass}::${method}() (${methodData.totalPluginCount} plugin instance${methodData.totalPluginCount !== 1 ? 's' : ''}) ---\n`;

        for (const scope of Object.keys(methodData.scopeResults)) {
          const scopeData = methodData.scopeResults[scope];
          text += formatScopeBlock(scope, scopeData);
        }
      }
    } else {
      text += `\nNo plugins found for any method of ${data.targetClass} in any scope.\n`;
    }
  }

  // Raw JSON for programmatic use
  text += `\n=== Raw JSON ===\n${JSON.stringify(data, null, 2)}`;

  return text;
}
