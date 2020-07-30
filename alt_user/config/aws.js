const aws = require('aws-sdk')
const multer = require('multer')
const multerS3 = require('multer-s3')
require("dotenv").config();

const s3 = new aws.S3({
    accessKeyId : process.env.IAM_USER_KEY,
    secretAccessKey : process.env.IAM_USER_SECRET,
 });

const storage = multerS3({
      s3: s3,
      acl : 'public-read',
      bucket: process.env.BUCKET_NAME,
      contentType : multerS3.AUTO_CONTENT_TYPE,
      metadata: function (req, file, cb) {
        cb(null, {fieldName: file.fieldname});
      },
      key: function (req, file, cb) {
        let account = req.session.user._id;
        let date = Date.now();
        if (file.mimetype === 'image/jpg') {
            let name = account + file.fieldname + '-' + date + '.jpg';
            cb(null, name);
        } else if (file.mimetype === 'image/jpeg') {
            let name = account + file.fieldname + '-' + date + '.jpeg';
            cb(null, name);
        } else if (file.mimetype === 'image/png') {
            let name = account + file.fieldname + '-' + date + '.png';
            cb(null, name);
        } else if (file.mimetype === 'application/pdf') {
            let name = account + file.fieldname + '-' + date + '.pdf';
            cb(null, name);
        }
    }
    });

const fileFilter = (req, file, cb) => {
    // reject a file
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type'), false);
    }
};

const uploadDrafts = multer({
    storage: storage,
    fileFilter: fileFilter
});

module.exports = {
    uploadDrafts
  }