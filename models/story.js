const mongoose = require('mongoose');
const storySchemas = mongoose.Schema({
    storyText:{
        type:String,
        required:true
    },
    type:{
        type:String,
        default:"public",
        enum :['public','private']
    },
    _creator:{
        type:mongoose.Schema.Types.ObjectId,
        required:true
    },
    _creatorName:{
        type:String,
        required:true
    },
    likes:{
        type:Number,
        default:0,
        required:true
    },
    likeby:[{
        type:String,
        default:null,
        required:true
    }],
    commentCount:{
        type:Number,
        default:0,
        required:true
    },
    comment:[
        {
            commentorId:{
                type:String
            },
            commentText:{
                type:String,
                required:true
            },
            commentorName:{
                type:String
            },
            commentDate:{
                type:Date,
                default:Date.now,
                required:true
            }
        }
    ]


});

const Story = mongoose.model('Story',storySchemas);
module.exports={ Story }