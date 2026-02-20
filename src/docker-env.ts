import { existsSync, readFileSync } from "fs";
import { join } from "path";

export interface DockerEnvironment {
  type: string;
  containerRoot: string;
  wrapCommand(cmd: string): string[];
  buildPhpCommands(scriptPath: string, args: string[]): string[];
}

/**
 * Escape a string for safe use inside single-quoted shell arguments.
 * Uses the standard end-quote, escaped-quote, re-open-quote pattern: '\''
 */
export function shellQuote(arg: string): string {
  return "'" + arg.replace(/'/g, "'\\''") + "'";
}

function createDockerEnv(
  type: string,
  containerRoot: string,
  wrapCommand: (cmd: string) => string[],
): DockerEnvironment {
  return {
    type,
    containerRoot,
    wrapCommand,
    buildPhpCommands(scriptPath: string, args: string[]): string[] {
      const quotedArgs = args.map(a => shellQuote(a)).join(' ');
      return wrapCommand(`php ${scriptPath} ${quotedArgs}`);
    },
  };
}

/**
 * Detect Docker environment type for the given project root.
 * Returns null if no Docker environment is detected.
 */
export function detectDockerEnvironment(projectRoot: string): DockerEnvironment | null {
  // Warden: .env file contains WARDEN_ENV_TYPE
  const envFile = join(projectRoot, '.env');
  if (existsSync(envFile)) {
    try {
      const envContent = readFileSync(envFile, 'utf8');
      if (envContent.includes('WARDEN_ENV_TYPE')) {
        return createDockerEnv('warden', '/var/www/html', (cmd) => [
          `warden shell -c ${shellQuote(cmd)}`,
        ]);
      }
    } catch {}
  }

  // DDEV: .ddev/ directory exists
  if (existsSync(join(projectRoot, '.ddev'))) {
    return createDockerEnv('ddev', '/var/www/html', (cmd) => [
      `ddev exec ${cmd}`,
    ]);
  }

  // docker-magento: bin/clinotty file exists
  if (existsSync(join(projectRoot, 'bin', 'clinotty'))) {
    return createDockerEnv('docker-magento', '/var/www/html', (cmd) => [
      `bin/clinotty ${cmd}`,
    ]);
  }

  // docker-compose: docker-compose.yml or compose.yaml exists
  if (
    existsSync(join(projectRoot, 'docker-compose.yml')) ||
    existsSync(join(projectRoot, 'compose.yaml'))
  ) {
    return createDockerEnv('docker-compose', '/var/www/html', (cmd) =>
      ['phpfpm', 'php-fpm', 'php'].map(
        service => `docker compose exec -T ${service} ${cmd}`,
      ),
    );
  }

  return null;
}
