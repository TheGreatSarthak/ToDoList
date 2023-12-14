const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));

main().catch((err) => console.log(err));

mongoose.connect(process.env.MongoDB);

async function main() {
  try {
    const itemsSchema = new mongoose.Schema({
      name: {
        type: String,
      },
    });
    const Item = mongoose.model("Item", itemsSchema);

    const item1 = new Item({
      name: "Welcome to do list",
    });
    const item2 = new Item({
      name: "Hit the + button to add a new task",
    });
    const item3 = new Item({
      name: "<- click this to remove a task",
    });
    const defaultItems = [item1, item2, item3];
    const listSchema = {
      name: {
        type: String,
      },
      items: [itemsSchema],
    };
    const List = mongoose.model("List", listSchema);

    app.get("/", async function (req, res) {
      const foundItems = await Item.find({}, { _id: 0, name: 1 });
      // foundItems.forEach(function (item) {
      //   console.log(item.name);
      // });
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems);
      }
      res.render("list", {
        listTitle: "Today",
        newListItems: foundItems,
      });
    });

    app.post("/", async function (req, res) {
      const itemName = req.body.newItem;
      const listName = req.body.list;
      const item = new Item({
        name: itemName,
      });
      if (listName === "Today") {
        if (itemName === "") {
          console.log("Add a task please");
        } else {
          item.save();
        }
        res.redirect("/");
      } else {
        const foundList = await List.findOne({ name: listName });
        if (itemName === "") {
          console.log("Add a task please");
        } else {
          foundList.items.push(item);
          foundList.save();
        }
        res.redirect("/" + listName);
      }
    });
    app.post("/delete", async function (req, res) {
      const checkedItemId = req.body.check;
      const listName=req.body.listName;
      // console.log(checkedItemId);
      // console.log(listName);
      if(listName==='Today'){
        await Item.deleteOne({ name: checkedItemId });
        res.redirect("/");
      } else {
        await List.findOneAndUpdate({name: listName},{$pull: {items: {name: checkedItemId}}});
        res.redirect("/" + listName);
      }
      
      
    });
    app.get("/:customListName", async function (req, res) {
      const listRouteName = _.capitalize(req.params.customListName);
      const checkIfExists = await List.findOne({ name: listRouteName });
      if (checkIfExists === null) {
        const list = new List({
          name: listRouteName,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + listRouteName);
      } else {
        res.render("list", {
          listTitle: checkIfExists.name,
          newListItems: checkIfExists.items,
        });
      }
    });
    app.get("/about", function (req, res) {
      res.render("about");
    });

    app.listen(3000, function () {
      console.log("Server started at port 3000.");
    });
  } catch (error) {
    console.log(error);
  } finally {
    //mongoose.connection.close();
  }
}
