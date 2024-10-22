import * as fs from 'fs';
export function loadConfig(configPath) {
    try {
        const configFile = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(configFile);
        return {
            ...config,
            recrawlAfterDays: config.recrawlAfterDays || 30,
            maxRetries: config.maxRetries || 3
        };
    }
    catch (error) {
        console.error(`Error loading configuration: ${error.message}`);
        throw error;
    }
}
//# sourceMappingURL=config.js.map