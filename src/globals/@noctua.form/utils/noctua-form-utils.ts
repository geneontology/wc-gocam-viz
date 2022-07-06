export class NoctuaFormUtils {

    public static cleanID(dirtyId: string) {
        if (dirtyId) {
            return dirtyId.replace(/\W/g, '_')
        }
        return dirtyId;
    }

    public static generateGUID() {
        function S4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }

        return S4() + S4();
    }

    public static pad(pad: string, count: number) {
        let counter = 0;
        let result = ''
        while (counter++ < count) {
            result += pad;
        }

        return result;
    }

    public static handleize(text) {
        return text.toString().toLowerCase()
            .replace(new RegExp("/\s+/g"), '-')           // Replace spaces with -
            .replace(new RegExp("/[^\w\-]+/g"), '')       // Remove all non-word chars
            .replace(new RegExp("/\-\-+/g"), '-')         // Replace multiple - with single -
            .replace(new RegExp("/^-+/"), '')             // Trim - from start of text
            .replace(new RegExp("/-+$/"), '');            // Trim - from end of text
    }

    public static cleanModelId(dirtyId: string) {
        if (!dirtyId) return dirtyId

        const prefix = 'gomodel:'

        let cleanId = dirtyId.trim();
        if (!cleanId.includes(prefix)) {
            cleanId = prefix + cleanId;
        }
        return cleanId;
    }

    public static splitAndAppend(str, delim, count) {
        const arr = str.split(delim);
        return [...arr.splice(0, count), arr.join(delim)];
    }
}
