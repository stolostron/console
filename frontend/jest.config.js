module.exports = {
    "preset": "ts-jest",
    "testEnvironment": "jsdom",
    "rootDir": "./src",
    "setupFilesAfterEnv": [
        "<rootDir>/setupTests.ts"
    ],
    "moduleNameMapper": {
        "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$": "<rootDir>/css.mock.js",
        "\\.(css|less)$": "<rootDir>/css.mock.js"
    },
    "watchPathIgnorePatterns": [
        "<rootDir>/../node_modules",
        "<rootDir>/../.eslintcache",
        "<rootDir>/../coverage"
    ],
    "moduleFileExtensions": [
        "js",
        "json",
        "jsx",
        "node",
        "ts",
        "tsx"
    ],
}
