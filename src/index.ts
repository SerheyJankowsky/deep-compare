import fs from "fs";
import path from "path";

type Translation = [string, Record<string, any>];
type TranslationArray = [string, Record<string, any>][];

//create list of files in sources folder
function createFileList() {
  try {
    const dirPath = path.join(__dirname, "sources");
    const files = fs.readdirSync(dirPath);
    return files;
  } catch (e) {
    console.error(e);
    return [];
  }
}

//read json files
function readJsonFile(files: string[]): TranslationArray {
  const jsonFiles = files.filter((file) => file.endsWith(".json"));
  const jsonFileContents = jsonFiles.map((file) => {
    const filePath = path.join(__dirname, "sources", file);
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const fileName = file.split(".")[0];
    return [fileName, JSON.parse(fileContent)];
  });
  return jsonFileContents as TranslationArray;
}

//read etalon file and compare with other files
function noneTranslateValue(etalon: string, files: TranslationArray) {
  const etalonFile = files.find((file) => file[0] === etalon)[1];
  const noneEtalonFiles = files.filter((file) => file[0] !== etalon);
  const result = noneEtalonFiles.reduce(
    (acc: Record<string, any>, [fileName, fileContent]) => {
      acc[fileName] = deepCompare(etalonFile, fileContent);
      return acc;
    },
    {},
  );
  return result;
}

//deep compare two objects
function deepCompare(obj1: Record<string, any>, obj2: Record<string, any>) {
  const result: Record<string, any> = {};

  for (const key in obj1) {
    if (obj1.hasOwnProperty(key)) {
      if (
        typeof obj1[key] === "object" &&
        obj1[key] !== null &&
        !Array.isArray(obj1[key])
      ) {
        const nestedComparison = deepCompare(obj1[key], obj2[key] || {});
        if (Object.keys(nestedComparison).length > 0) {
          result[key] = nestedComparison;
        }
      } else if (!obj2.hasOwnProperty(key)) {
        result[key] = obj1[key];
      }
    }
  }

  return result;
}

function createResultFile(result: Record<string, any>) {
  const resultFilePath = path.join(__dirname, "result.json");
  fs.writeFileSync(resultFilePath, JSON.stringify(result, null, 2));
}

function start() {
  const files = createFileList();
  const readedFiles = readJsonFile(files);
  const result = noneTranslateValue("en", readedFiles);
  createResultFile(result);
}

start();
