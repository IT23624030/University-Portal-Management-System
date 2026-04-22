export default {
    testEnvironment: "jsdom",
    setupFiles: ["<rootDir>/jest.setup.js"],
    transform: {
        "^.+\\.[t|j]sx?$": "babel-jest"
    },
    moduleNameMapper: {
        "\\.(css|less|scss|sass)$": "identity-obj-proxy",
        "lucide-react": "<rootDir>/node_modules/lucide-react"
    }
};