const util = require("util");
const fse = require("fs-extra");

const template = (props) => `import {Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {Game} from "./../game";

@Entity()
@Index(["fenHash", "gamesId"], { unique: true })
export class ${props.name} {

    @PrimaryGeneratedColumn({type: "bigint"})
    id: number;

    @Index()
    @Column({length: 18})
    fenHash: string;

    @Index()
    @Column({type: "bigint"})
    gamesId: number;
    
    @ManyToOne(type => Game, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
    games: Game[];
}
`;


async function writeFile(filePath, content) {
  try {
    await fse.writeFile(filePath, content);
  } catch (err) {
    console.log(filePath);
    console.error({error: err});
    throw err;
  }
}

const dirPath = "src/modules/gameDatabase/entity/indexEntities";

const possibleLetters = "qwertyuiopasdfghjklzxcvbnm1234567890".split("");
const {length} = possibleLetters;

fse.emptyDirSync(dirPath);

let indexTemplateImports = "";
let indexTemplateObj = "";
for (let i = 0; i < length; i++) {
  for (let j = 0; j < length; j++) {

    const name = `MoveI${possibleLetters[i]}${possibleLetters[j]}`;
    writeFile(`${dirPath}/${name}.ts`, template({name}));
    indexTemplateImports += getImportLine(name);
    indexTemplateObj += getObjLine(name);
  }
}

function getImportLine(name) {
  return `import {${name}} from "./${name}";
`;
}

function getObjLine(name) {
  return `${name},
`;
}

const indexTemplate = `
${indexTemplateImports}

export const indexEntities = {
   ${indexTemplateObj}
}
`;

writeFile(`${dirPath}/index.ts`, indexTemplate);
