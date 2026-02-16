import { exec, ExecOptions } from "child_process";
import { promisify } from "util";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync, readFileSync, readdirSync, copyFileSync, mkdirSync, rmSync } from "fs";

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface DockerEnvironment {
  type: string;
  buildCommands: (scriptPath: string, args: string[]) => string[];
  containerRoot: string;
}

export type PhpScriptResult =
  | { success: true; data: any }
  | { success: false; error: string; isError: true };

/**
 * Escape a string for safe use inside single-quoted shell arguments.
 * Uses the standard end-quote, escaped-quote, re-open-quote pattern: '\''
 */
function shellQuote(arg: string): string {
  return "'" + arg.replace(/'/g, "'\\''") + "'";
}

/**
 * Detect Docker environment type for the given project root.
 * Returns null if no Docker environment is detected.
 */
function detectDockerEnvironment(projectRoot: string): DockerEnvironment | null {
  const buildSingleCommand = (prefix: string) =>
    (scriptPath: string, args: string[]) => {
      const quotedArgs = args.map(a => shellQuote(a)).join(' ');
      return [`${prefix} php ${scriptPath} ${quotedArgs}`];
    };

  // Warden: .env file contains WARDEN_ENV_TYPE
  const envFile = join(projectRoot, '.env');
  if (existsSync(envFile)) {
    try {
      const envContent = readFileSync(envFile, 'utf8');
      if (envContent.includes('WARDEN_ENV_TYPE')) {
        return {
          type: 'warden',
          buildCommands: (scriptPath, args) => {
            const quotedArgs = args.map(a => shellQuote(a)).join(' ');
            return [`warden shell -c "php ${scriptPath} ${quotedArgs}"`];
          },
          containerRoot: '/var/www/html',
        };
      }
    } catch {}
  }

  // DDEV: .ddev/ directory exists
  if (existsSync(join(projectRoot, '.ddev'))) {
    return {
      type: 'ddev',
      buildCommands: buildSingleCommand('ddev exec'),
      containerRoot: '/var/www/html',
    };
  }

  // docker-magento: bin/clinotty file exists
  if (existsSync(join(projectRoot, 'bin', 'clinotty'))) {
    return {
      type: 'docker-magento',
      buildCommands: buildSingleCommand('bin/clinotty'),
      containerRoot: '/var/www/html',
    };
  }

  // docker-compose: docker-compose.yml or compose.yaml exists
  if (existsSync(join(projectRoot, 'docker-compose.yml')) || existsSync(join(projectRoot, 'compose.yaml'))) {
    return {
      type: 'docker-compose',
      buildCommands: (scriptPath, args) => {
        const quotedArgs = args.map(a => shellQuote(a)).join(' ');
        return ['phpfpm', 'php-fpm', 'php'].map(
          service => `docker compose exec -T ${service} php ${scriptPath} ${quotedArgs}`
        );
      },
      containerRoot: '/var/www/html',
    };
  }

  return null;
}

/**
 * Execute a PHP command, log stderr, and return parsed JSON output.
 * Throws on exec failure or JSON parse failure.
 */
async function runPhpCommand(command: string, execOptions: ExecOptions): Promise<any> {
  const { stdout, stderr } = await execAsync(command, execOptions);

  if (stderr && String(stderr).trim()) {
    console.error("PHP script stderr:", stderr);
  }

  return JSON.parse(String(stdout));
}

/**
 * Try executing a PHP script inside a Docker container.
 * Returns null when all Docker attempts fail (signals "fall back to local").
 */
async function executeViaDocker(
  dockerEnv: DockerEnvironment,
  scriptName: string,
  args: string[],
  phpSourceDir: string,
  projectRoot: string,
  execOptions: ExecOptions,
): Promise<PhpScriptResult | null> {
  const tmpDir = join(projectRoot, 'var', 'tmp', 'mcp-php');
  try {
    // Copy PHP scripts to project root (which is Docker-mounted)
    mkdirSync(tmpDir, { recursive: true });
    for (const file of readdirSync(phpSourceDir)) {
      copyFileSync(join(phpSourceDir, file), join(tmpDir, file));
    }

    const containerArgs = [...args];
    containerArgs[0] = dockerEnv.containerRoot;
    const containerScriptPath = `${dockerEnv.containerRoot}/var/tmp/mcp-php/${scriptName}`;
    const commands = dockerEnv.buildCommands(containerScriptPath, containerArgs);

    for (const command of commands) {
      try {
        const data = await runPhpCommand(command, execOptions);
        return { success: true, data };
      } catch {
        continue;
      }
    }

    console.error(`Docker execution failed (${dockerEnv.type}), falling back to local PHP`);
    return null;
  } finally {
    try {
      rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  }
}

/**
 * Execute a PHP script using the local PHP binary.
 */
async function executeViaLocalPhp(
  scriptName: string,
  args: string[],
  phpSourceDir: string,
  execOptions: ExecOptions,
  dockerEnvType: string | null,
): Promise<PhpScriptResult> {
  try {
    const scriptPath = join(phpSourceDir, scriptName);
    const command = `php ${shellQuote(scriptPath)} ${args.map(a => shellQuote(a)).join(' ')}`;
    const data = await runPhpCommand(command, execOptions);
    return { success: true, data };
  } catch (localError) {
    const errorMessage = localError instanceof Error ? localError.message : String(localError);

    if (dockerEnvType) {
      return {
        success: false,
        error: `Failed to execute PHP script via ${dockerEnvType} Docker environment and local PHP.\n\nError: ${errorMessage}\n\nEnsure PHP is available in your Docker container or locally.`,
        isError: true,
      };
    }

    if (errorMessage.includes("command not found") || errorMessage.includes("not recognized")) {
      return {
        success: false,
        error: "Error: PHP not found. Please ensure PHP is available in your PATH, or run from a Docker-based Magento environment (Warden, DDEV, docker-magento, or docker-compose).",
        isError: true,
      };
    }

    return {
      success: false,
      error: `Error executing PHP script: ${errorMessage}`,
      isError: true,
    };
  }
}

/**
 * Execute a PHP analysis script, trying Docker first, then local PHP.
 */
export async function executePhpScript(scriptName: string, args: string[]): Promise<PhpScriptResult> {
  const phpSourceDir = join(__dirname, '..', 'php');
  const projectRoot = process.cwd();
  const dockerEnv = detectDockerEnvironment(projectRoot);
  const execOptions = { cwd: projectRoot, timeout: 60000, maxBuffer: 10 * 1024 * 1024 };

  if (dockerEnv) {
    const result = await executeViaDocker(dockerEnv, scriptName, args, phpSourceDir, projectRoot, execOptions);
    if (result) return result;
  }

  return executeViaLocalPhp(scriptName, args, phpSourceDir, execOptions, dockerEnv?.type ?? null);
}
