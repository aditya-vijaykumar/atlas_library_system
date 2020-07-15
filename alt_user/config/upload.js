const multer = require("multer");

const storageDrafts = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/temp');
    },
    filename: function (req, file, cb) {
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

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads');
    },
    filename: function (req, file, cb) {
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

const upload = multer({
    storage: storage,
    fileFilter: fileFilter
});

const uploadDrafts = multer({
    storage: storageDrafts,
    fileFilter: fileFilter
});

module.exports = {
    upload,
    uploadDrafts
  }