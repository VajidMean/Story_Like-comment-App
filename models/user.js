const mongoose = require('mongoose');

const userSchemas = mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true,
    },
    isadmin:{
        type:Boolean,
        required:true,
        default:false
    },
    isblocked:{
        type:Boolean,
        required:true,
        default:false
    }
})

const User = mongoose.model('User',userSchemas);
module.exports = { User }