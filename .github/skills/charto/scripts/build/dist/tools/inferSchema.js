const isDateLike = (value) => {
    if (value.trim().length === 0) {
        return false;
    }
    const timestamp = Date.parse(value);
    return !Number.isNaN(timestamp);
};
const detectFieldType = (values) => {
    const presentValues = values.filter((value) => value !== null);
    if (presentValues.length === 0) {
        return "string";
    }
    if (presentValues.every((value) => typeof value === "number")) {
        return "number";
    }
    if (presentValues.every((value) => typeof value === "boolean")) {
        return "boolean";
    }
    if (presentValues.every((value) => typeof value === "string" && isDateLike(value))) {
        return "date";
    }
    return "string";
};
export const inferSchema = (rows) => {
    if (rows.length === 0) {
        throw new Error("Cannot infer schema from an empty dataset.");
    }
    const columns = Object.keys(rows[0]);
    return {
        fields: columns.map((name) => ({
            name,
            type: detectFieldType(rows.map((row) => row[name] ?? null))
        }))
    };
};
