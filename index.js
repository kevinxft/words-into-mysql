const { Sequelize, DataTypes } = require("sequelize");
const fs = require("fs");
const path = require("path");

const dataFolderName = "data";

async function updateDictData() {
  const sequelize = new Sequelize("vocab", "root", "123456", {
    host: "localhost",
    dialect: "mysql",
  });

  const Word = sequelize.define("Word", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    meaning: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    pronunUS: {
      type: DataTypes.STRING,
    },
    pronunUK: {
      type: DataTypes.STRING,
    },
  });
  await Word.sync({ force: true });
  try {
    const jsonList = await getJsonList();
    for (let file of jsonList) {
      const data = await getFileData(file);
      const words = JSON.parse(data);
      for (let word of words) {
        try {
          let content = word.content.word.content;
          const { trans, usphone, ukphone } = content;
          // findOrCreate
          await Word.findOrCreate({
            where: { name: word.headWord },
            defaults: {
              meaning: getTrans(trans),
              pronunUK: ukphone,
              pronunUS: usphone,
            },
          });
        } catch (error) {
          console.error("", error);
        }
      }
    }
  } catch (error) {
    console.error(error);
    Promise.reject();
  }
  sequelize.close();
}

const getTrans = (trans) => {
  return trans.reduce((pre, cur) => {
    pre += ` ${cur.pos ? cur.pos + ". " : ""}${cur.tranCn}`;
    return pre;
  }, "");
};

// get json list
async function getJsonList() {
  const dataPath = path.resolve(dataFolderName);
  let fileList = fs.readdirSync(dataPath);
  fileList = fileList.filter((item) => item.includes(".json"));
  return fileList.map((fileName) => path.resolve(dataFolderName, fileName));
}
//  读取数据
async function getFileData(filePath) {
  try {
    let content = fs.readFileSync(filePath, { encoding: "utf-8" });
    content = `[${content}]`;
    content = content.replaceAll(/}\r\n/g, "},\n");
    content = content.replaceAll(/},\n\]/g, "}]\n");
    return content;
  } catch (error) {
    console.error("filePath: " + filePath, error);
    return `[]`;
  }
}

const calcTimeRun = async () => {
  const startTime = new Date();
  await updateDictData();
  const endTime = new Date(); // 记录执行后的时间点
  const elapsedTime = (endTime - startTime) / (1000 * 60); // 计算耗时，精确到分钟
  console.log(`代码执行时间：${elapsedTime.toFixed(2)}分钟`);
};

calcTimeRun();
