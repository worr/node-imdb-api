import express from "express";
import { promises as fs } from "fs";
import path from "path";
import cors from "cors";

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

async function readFromFile(filename: string): Promise<Object> {
  const fullpath = path.join(__dirname, "..", "data", filename);
  const rawdata = await fs.readFile(fullpath);

  return JSON.parse(rawdata.toString());
}

async function getByTitle(name: string): Promise<Object> {
  const newname = `${name.replace(" ", "-")}.json`.toLowerCase();
  return readFromFile(newname);
}

async function search(name: string): Promise<Object> {
  const search = `${name.replace(" ", "-")}-search.json`.toLowerCase();
  return readFromFile(search);
}

app.get("/", async (req: express.Request, res: express.Response) => {
  if (req.query === undefined) {
    res.send({ error: "req.query undefined" });
    return;
  }

  const isGet = req.query.t !== undefined || req.query.i !== undefined;
  const isSearch = req.query.s !== undefined;
  let ret: object = { error: `Invalid query: ${JSON.stringify(req.query)}` };

  if (isGet) {
    if (req.query.t !== undefined && typeof req.query.t === "string") {
      const title = req.query.t;
      try {
        ret = await getByTitle(title);
      } catch (e) {
        ret = { error: e.message };
      }
    } else if (req.query.i !== undefined && typeof req.query.i === "string") {
      const id = req.query.i;
      try {
        ret = await getByTitle(id);
      } catch (e) {
        ret = { error: e.message };
      }
    }
  } else if (isSearch) {
    if (typeof req.query.s === "string") {
      const searchTerm = req.query.s;
      try {
        ret = await search(searchTerm);
      } catch (e) {
        ret = { error: e.message };
      }
    }
  }

  res.send(ret);
});

app.listen(port, () => {
  console.log(`Test server listening https://localhost:${port}`);
});
