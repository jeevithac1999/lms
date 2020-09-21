const Course = require('../models/course.model')
const User = require('../models/user.model')
const _ = require('lodash')
const errorHandler = require('../helpers/dbErrorHandler')
const formidable = require('formidable')
const fs = require('fs')

const create = (req, res) => {
  Course.create(req.body)
    .then(function(dbCourse) {
      console.log("NEW COURSE:")
      console.log(dbCourse)
      return User.update({_id:req.body.instructor}, { $push: { courses: dbCourse._id } }, { new: true });
    })
    .then(function(dbUser) {

      res.json(dbUser);
    })
    .catch(function(err) {

      res.json(err);
    })
};


const courseById = (req, res, next, id) => {
  Course.findById(req.params.courseId)
    .then(function(dbCourse) {

      req.profile = dbCourse
    next()
    })
    .catch(function(err) {

      res.json(err);
  });
}

const read = (req, res) => {
  return res.json(req.profile)
}

const list = (req, res) => {
  Course.find((err, courses) => {
    if (err) {
      return res.status(400).json({
        error: errorHandler.getErrorMessage(err)
      })
    }
    res.json(courses)
  }).select('title description courseCode students instructor')
}

const listOne = (req, res) => {
  Course.findById(req.params.courseId)
    .then(function(dbCourse) {
      res.json(dbCourse);
    })
    .catch(function(err) {

      res.json(err);
  });
}

const update = (req, res, next) => {
  console.log("updating..")
  let form = new formidable.IncomingForm()
  form.keepExtensions = true
  form.parse(req, (err, fields, files) => {
    if (err) {
      return res.status(400).json({
        error: "Photo could not be uploaded."
      })
    }
    let course = req.profile
    course = _.extend(course, fields)
    course.updated = Date.now()
    if(files.photo){
      course.photo.data = fs.readFileSync(files.photo.path)
      course.photo.contentType = files.photo.type
    }
    course.save((err, result) => {
      if (err) {
        return res.status(400).json({
          error: errorHandler.getErrorMessage(err)
        })
      }
      res.json(course)
    })
  })
}

const remove = (req, res, next) => {
  let user = req.profile
  user.remove((err, deletedUser) => {
    if (err) {
      return res.status(400).json({
        error: errorHandler.getErrorMessage(err)
      })
    }
    deletedUser.hashed_password = undefined
    deletedUser.salt = undefined
    res.json(deletedUser)
  })
}

const photo = (req, res, next) => {
  if(req.profile.photo.data){
    res.set("Content-Type", req.profile.photo.contentType)
    return res.send(req.profile.photo.data)
  }

  next()
}

const defaultPhoto = (req, res) => {
  return res.sendFile(process.cwd()+'/client/public/assets/images/chair.png')
}

const addStudent = (req, res) => {
  let course = req.body.courseCode
  Course.findOneAndUpdate({courseCode: course}, {$push: {students: req.body.userId}}, {new: true})
  .exec((err, result) => {
        if (err) {
      return res.status(400).json({
        error: errorHandler.getErrorMessage(err)
      })
    }
    res.json(result)
  })
}


module.exports = {
  create,
  courseById,
  read,
  remove,
  update,
  photo,
  defaultPhoto,
  addStudent,
  list, 
  listOne
}
