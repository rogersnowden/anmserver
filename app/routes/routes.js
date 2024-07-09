const express = require('express');
const path = require('path');
const { authJwt } = require("../middlewares");
const controller = require("../controllers/auth.controller");
const prodcontroller = require("../controllers/prod.controller");
const dbtrans = require("../controllers/dbtrans.controller");
const auth = require("../middlewares/authJwt");
var logger = require('log4js').getLogger();
const fs = require('fs-extra');
const multer = require('multer');

// Define storage configuration for multer
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const userName = req.body.userName;
    const productSKU = req.body.productSKU;
    const uploadPath = path.join(global.basePath, 'users', userName, 'mybooks', productSKU);
    console.log("upload path: " + uploadPath);

    // Ensure the directory exists
    try {
      await fs.ensureDir(uploadPath);
      cb(null, uploadPath);
    } catch (err) {
      cb(err);
    }
  },
  filename: function (req, file, cb) {
    const pageIndex = req.body.pageIndex;
    const filename = `page${pageIndex}audio.wav`; // Construct the filename using pageIndex
    cb(null, filename);
  }
});

const upload = multer({ storage: storage });

module.exports = function (app) {

  logger.debug("in the routes.js file");

  function errorHandler(err, req, res, next) {
    logger.debug("err handler: " + err);
    res.status(401).json({ message: err });
  }

  function getHttpResponse(errorMessage) {
    switch (errorMessage) {
      case "Valid Session":
        return 200;
      case "Session Not Found":
        return 404;
      case "Session Timeout":
      case "Session Expired":
      case "Invalid Password":
      case "Username Not Found":
        return 401;
      default:
        return 500;
    }
  }

  app.get('/', (req, res) => {
    logger.debug("empty get req");
    if (req.session.loggedIn)
      logger.debug("empty get req, logged in")
    else {
    }
    res.redirect('testlogin.html', './')
  });

  app.post("/api/login", (req, res) => {
    logger.debug("routes login ");
    controller.login(req, res)
      .then(data => {
        res.status(200).json(data);
      })
      .catch(err => {
        logger.debug("bad login: " + err.message);
        res.status(500).json({ message: err.message });
      });
  });

  app.post("/api/logout", controller.validateSession, (req, res, next) => {
    logger.debug("routes logout accessToken: " + req.accessToken);
    next();
  });

  app.post('/api/logout', (req, res) => {
    controller.logout(req, res, (error, result) => {
      if (error) {
        res.status(error.status || 500).send(error.message);
      } else {
        logger.debug("status: " + result);
        res.status(200).send('logout');
      }
    });
  });

  app.post('/api/register', (req, res) => {
    logger.debug("routes register called: " + req.body.username + ' ' + req.body.password);
    controller.register(req, res)
      .then(data => {
        res.status(200).json(data);
      })
      .catch(err => {
        if (err.message === "Username already exists") {
          res.status(409).json({ message: "Username already exists. Please choose a different username." });
        } else {
          res.status(500).json({ message: err.message });
        }
      });
  });

  app.post("/api/getprofile", (req, res) => {
    controller.validateSession(req, res)
      .then(user => {
        return controller.getProfile(req, res);
      })
      .then(profileDocument => {
        logger.debug("got prof: " + profileDocument);
        res.status(200).json(profileDocument);
      })
      .catch(error => {
        res.status(error.status || 500).json({ message: error.message });
      });
  });

  app.post('/api/saveprofile', (req, res) => {
    controller.validateSession(req, res)
      .then(user => {
        controller.saveProfile(req, res);
      })
      .then(updatedDocument => {
        logger.debug("save, got updated doc: " + updatedDocument);
        res.status(200).json(updatedDocument);
      })
      .catch(error => {
        res.status(error).json({ message: error.message });
      });
  });

  app.post('/api/pwdreset', (req, res) => {
    logger.debug("pwdreset start");
    controller.pwdreset(req, res)
      .then(data => {
        logger.debug("routes reset good result");
        res.status(200).json(data);
      })
      .catch(err => {
        logger.debug("routes, reset err: " + err.message);
        res.status(500).json({ message: err.message });
      });
    logger.debug("pwdreset end");
  });

  app.post("/api/pwdset", (req, res) => {
    logger.debug("routes pwdset ");
    controller.pwdset(req, res)
      .then(data => {
        res.status(200).json(data);
      })
      .catch(err => {
        res.status(500).json({ message: err.message });
      });
  });

  app.post("/api/getlibrary", async (req, res) => {
    try {
      await controller.validateSession(req, res);
      const libraryDocument = await prodcontroller.getLibrary(req, res);
      logger.debug("got user lib: " + libraryDocument);
      res.status(200).json(libraryDocument);
    } catch (error) {
      res.status(error.status || 500).json({ message: error.message });
    }
  });

  app.post("/api/getUserBook", async (req, res) => {
    try {
      await controller.validateSession(req, res);
      const userBook = await prodcontroller.getUserBook(req, res);
      logger.debug("got user book: " + userBook);
      res.status(200).json(userBook);
    } catch (error) {
      res.status(error.status || 500).json({ message: error.message });
    }
  });

  app.post("/api/getUserBookImages", async (req, res) => {
    try {
      await controller.validateSession(req, res);
      const userBookImages = await prodcontroller.getUserBookImages(req, res);
      logger.debug("got user book images: " + userBookImages);
      res.status(200).json(userBookImages);
    } catch (error) {
      res.status(error.status || 500).json({ message: error.message });
    }
  });

  app.post("/api/getUserBookAudio", async (req, res) => {
    try {
      await controller.validateSession(req, res);
      const userBookAudio = await prodcontroller.getUserBookAudio(req, res);
      logger.debug("got user book audio: " + userBookAudio);
      res.status(200).json(userBookAudio);
    } catch (error) {
      res.status(error.status || 500).json({ message: error.message });
    }
  });

  app.post("/api/getbook", (req, res) => {
    controller.validateSession(req, res)
      .then(user => {
        return controller.getBook(req, res);
      })
      .then(bookDocument => {
        logger.debug("got prof: " + bookDocument);
        res.status(200).json(bookDocument);
      })
      .catch(error => {
        res.status(error.status || 500).json({ message: error.message });
      });
  });

  // Route to handle single audio file upload
app.post('/api/saveAudioFile', async (req, res) => {
  const { userName, productSKU, currentPageIndex } = req.query;
  const audioBlob = req.body;

  if (!audioBlob || !userName || !productSKU || !currentPageIndex) {
    return res.status(400).json({ message: 'Missing required parameters' });
  }

  const uploadPath = path.join(global.basePath, 'users', userName, 'mybooks', productSKU);
  const filename = `page${currentPageIndex}audio.wav`;
  const filePath = path.join(uploadPath, filename);

  try {
    await fs.ensureDir(uploadPath);
    await fs.writeFile(filePath, audioBlob);
    console.log(`Received file ${filename} from ${userName} for product ${productSKU} at page ${currentPageIndex}`);
    res.status(200).json({ message: 'File uploaded successfully', file: filename });
  } catch (error) {
    console.error('Error saving file', error);
    res.status(500).json({ message: 'Error saving file', error: error.message });
  }
});
  // errorHandler for all cases, function errorHandler defined above
  app.use(errorHandler);
};
