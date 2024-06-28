const express = require("express");
const _ = require("lodash");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
require('dotenv').config()

const date = require(__dirname+"/date");
const app = express();
const day = date.getDate();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine','ejs');


mongoose.connect(process.env.mongoURL);
const itemsSchema =new mongoose.Schema({
    
    name:String
}); 

const Item = mongoose.model("Item",itemsSchema);

const item1 = new Item({
    name:"Welcome to TO-DO list"
});

const item2 = new Item({
    name:"Hit the + button to add a new item"
});

const item3 = new Item({
    name:"<-- Hit this to delete an item"
});

const defaultItems = [item1,item2,item3];

const listSchema = {
    name:String,
    items:[itemsSchema]
}
const List = mongoose.model("List",listSchema);




app.get("/",(req,res)=>{

    Item.find().then((foundItems)=>{
        if(foundItems.length===0){
            Item.insertMany(defaultItems).then(()=>{
                console.log("Added default items");
            });
            res.redirect("/");
        }else{
            res.render("list",{listTitle:day,newListItems:foundItems});
        }

    });
});
app.get("/:customListName",async(req,res)=>{
    const customListName =_.capitalize(req.params.customListName);

    await List.findOne({name:customListName}).then((foundList)=>{
        if(!foundList){
            const list = new List({
                name:customListName,
                items:defaultItems
        });
            list.save();
            res.redirect("/"+customListName);
        }
        else{
            res.render("list",{listTitle:foundList.name, newListItems:foundList.items});
        }    
        
    })
    
});


app.post("/",async (req,res)=>{
    const itemName =(req.body.newItem);
    const listName = req.body.list;
    const item = new Item({
        name:itemName
    });
    console.log(listName+" "+day);
    if(listName===day){
        
        item.save();
        res.redirect("/");
    }else{
       await List.findOne({name:listName}).then((foundList)=>{
            foundList.items.push(item);
            foundList.save();
            res.redirect("/"+listName);
        })
        .catch((err)=>{
            console.log(err);
        });
    }
});

app.post("/delete",(req,res)=>{ 
    const checkedItemId = req.body.checkbox;
    const listName=req.body.listName;
    if(listName===day){
        Item.findByIdAndDelete(checkedItemId).then(()=>{
            console.log("Deleted checked item Successfully");
            res.redirect("/");
        });
    }else{
        List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkedItemId}}}).then((foundList)=>{
            res.redirect("/"+listName);
        })
    }
    
    
})



app.listen("3000",()=>{
    console.log("Server Started at port 3000!");
});