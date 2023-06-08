const fs = require('fs');


function makeRandomString(length: number, firstCharCase: 'l' | 'u') {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
    let ch = characters.charAt(Math.floor(Math.random() * charactersLength));
      result += counter === 0 ? firstCharCase === 'l' ? ch.toLocaleLowerCase() : ch.toUpperCase() : ch;
      counter += 1;
    }
    
    return result;
}

type ArrayTypes = Array<PSTypes>;
type RecordTypes = Map<string, PSTypes>;

type PSTypes =
  | "Boolean"
  | "Maybe Boolean"
  | "String"
  | "Int"
  | "Maybe String"
  | "Maybe Int"
  | ArrayTypes
  | RecordTypes;

// Type guard for ArrayTypes
function isArrayTypes(value: any): value is ArrayTypes {
  return Array.isArray(value) && value.every(isPSTypes);
}

// Type guard for RecordTypes
function isRecordTypes(value: any): value is RecordTypes {
  return value instanceof Map && Array.from(value.values()).every(isPSTypes);
}

// Type guard for PSTypes
function isPSTypes(value: any): value is PSTypes {
  return (
    value === "Boolean" ||
    value === "Maybe Boolean" ||
    value === "String" ||
    value === "Int" ||
    value === "Maybe String" ||
    value === "Maybe Int" ||
    isArrayTypes(value) ||
    isRecordTypes(value)
  );
}

let maxLength = 30;

function generateValue(arg: PSTypes):any {
  if (arg === "Boolean") {
    return Math.random() < 0.5
  }
  if (arg === "Maybe Boolean") {
    if(Math.random()<.5){
      return null;
    } else {
      return Math.random() < 0.5 
    }
  }
  if (arg === "String") {
    return makeRandomString(10,'l');
  }
  if (arg === "Maybe String"){
    if(Math.random() <.5)
      return null;
    else
      return makeRandomString(10,'l'); 
  }
  if (arg === "Int") {
    return Math.round(Math.random()*1000 - 500);
  }
  if (arg === "Maybe Int") {
    if(Math.random()<.5){
      return null;
    } else {
      return Math.round(Math.random()*1000 - 500);
    }
  }
  if (isArrayTypes(arg)){
    
    let v1  = []
    for(let j = 0; j < arg.length ; ++j){
      let c:PSTypes = arg[j];
      v1.push(generateValue(c))
    }
    return v1;
  }
  let v: Record<string, any> = {};
  arg.forEach((key, value) => {
    v[value] = generateValue(key); 
  })
  return v;
}

function generateRandomPSType(depth: number): PSTypes {
  if(Math.random()<.5 || depth < 1){
    let arr:PSTypes = [ "Maybe String", "Boolean", "Int","Maybe Boolean","Maybe Int","String"];
    return arr[Math.round((arr.length+1) * Math.random()) % arr.length];
  } else if (Math.random() < .5) {
    let arr:PSTypes = [ "Maybe String", "Boolean", "Int","Maybe Boolean","Maybe Int","String"];
    let pstype = arr[Math.round((arr.length+1) * Math.random()) % arr.length];
    let length = Math.round(maxLength * Math.random());
    let v: PSTypes= [];
    for(let j=0;j<length;++j){
      v.push(pstype);
    }
    return v;
  } else {
    let length = 5 + Math.round(maxLength * Math.random());
    let map: Map<string, PSTypes> = new Map();


    for(let j=0;j<length;++j){
      map.set(makeRandomString(10,'l'), generateRandomPSType(depth-1));
    }
    return map;
  }
}

function printPSTypes(arg:PSTypes, indent: number){
  if (!isArrayTypes(arg)&&!isRecordTypes(arg)){
    process.stdout.write(`${arg}`);
  } else if (isArrayTypes(arg)){
    if(arg.length > 0) {
      let v:PSTypes = arg[0];
      process.stdout.write(`Array (`)
      printPSTypes(v,indent);
      process.stdout.write(`)`) 
    } else {
      console.log(`Maybe (Array {})`)
    }
  } else {
    let t = true;
    let padding = " ".repeat(indent);
    arg.forEach((key, value) => {
      let str: string = ",";
      if(t) {str = "{"; t = false;}

      process.stdout.write(`${padding}${str} ${value} :: `)
      if(isRecordTypes(key)){
        process.stdout.write('\n');
        printPSTypes(key, indent +4);
      } else {
        printPSTypes(key, indent);
        process.stdout.write("\n")
      }
     
    })
    console.log(`${padding}}`)
  }
  return ""
}

const Avinash:RecordTypes = new Map();

for(let j=0;j<50;++j){
  Avinash.set(makeRandomString(4,'l'), generateRandomPSType(3));
}

// console.log(Avinash);

console.log("module Avinash where")
console.log("")

console.log(`
import Data.Maybe (Maybe)
import Prelude ((<$>))
import Foreign.Generic (class Decode, Foreign, decode)
`)

console.log("")

console.log("newtype Avinash = Avinash")
console.log(printPSTypes(Avinash, 20));

console.log("")
console.log("")

console.log("instance Decode Avinash where decode fgn = Avinash <$> decode fgn")


fs.writeFile("temp.json", JSON.stringify(generateValue(Avinash)), () => {});

fs.writeFile("temp.js", JSON.stringify([...Avinash]), ()=> {});