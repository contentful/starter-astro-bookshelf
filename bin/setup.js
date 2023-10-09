import spaceImport from 'contentful-import';
import inquirer from 'inquirer';
import { randomBytes } from "crypto";
import { readFile, writeFile } from "fs/promises";
import { join, basename, resolve } from "path";
import sort from "sort-package-json";

function escapeRegExp(string) {
    // $& means the whole matched string
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getRandomString(length) {
    return randomBytes(length).toString("hex");
}

async function main() {
    const __dirname = resolve();
    const README_PATH = join(__dirname, "README.md");
    const PACKAGE_JSON_PATH = join(__dirname, "package.json");

    const REPLACER = "contentful-remix-stack";

    const DIR_NAME = basename(__dirname);
    const SUFFIX = getRandomString(2);
    const APP_NAME = DIR_NAME + "-" + SUFFIX;

    const [readme, packageJson] = await Promise.all([
        readFile(README_PATH, "utf-8"),
        readFile(PACKAGE_JSON_PATH, "utf-8"),
    ]);

    const newReadme = readme.replace(
        new RegExp(escapeRegExp(REPLACER), "g"),
        APP_NAME
    );

    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'spaceId',
            message: 'Enter you Contentful Space ID',
            validate(value) {
                if (!value.length > 0) {
                    return 'Must enter a Space ID'
                }
                return true
            }
        },
        {
            type: 'input',
            name: 'contentDeliveryApiKey',
            message: 'Enter you Content Delivery API Key',
            validate(value) {
                if (!value.length > 0) {
                    return 'Must enter Content Delivery API Key'
                }
                return true
            }
        },
        {
            type: 'input',
            name: 'contentManagementToken',
            message: 'Enter you Content Management Token',
            validate(value) {
                if (!value.length > 0) {
                    return 'Must enter Content Management Token'
                }
                return true
            }
        }
    ]);
    console.log('Creating .env file...')
    const ENV_PATH = join(__dirname, ".env")
    const newEnv = [
        `# All environment variables will be sourced`,
        `# and made available.`,
        `# Do NOT commit this file to source control`,
        `CONTENTFUL_SPACE_ID='${answers.spaceId}'`,
        `CONTENTFUL_DELIVERY_TOKEN='${answers.contentDeliveryApiKey}'`,
    ]
        .filter(Boolean)
        .join('\n')

    const newPackageJson =
        JSON.stringify(
            sort({ ...JSON.parse(packageJson), name: APP_NAME }),
            null,
            2
        ) + "\n";

    console.log(
        `Updating files...`
    );

    await Promise.all([
        writeFile(README_PATH, newReadme),
        writeFile(ENV_PATH, newEnv),
        writeFile(PACKAGE_JSON_PATH, newPackageJson),
    ]);

    console.log(
        `Running the setup script to import content model`
    );

    await spaceImport({
        contentFile: `${__dirname}/bin/contentful/export.json`,
        spaceId: answers.spaceId,
        managementToken: answers.contentManagementToken
    })

    console.log(`✅  Project is ready! Start development with "npm run dev"`);
}

main()