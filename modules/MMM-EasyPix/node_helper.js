"use strict";

const path = require("path");
const os = require("os");
const fs = require("fs");
const { access, readdir } = require("fs/promises");
const NodeHelper = require("node_helper");

const SUPPORTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp"];

module.exports = NodeHelper.create({
  start () {
    this.instances = new Map();
    this.routeInitialized = false;
  },

  async socketNotificationReceived (notification, payload) {
    if (!payload || !payload.identifier) return;

    switch (notification) {
      case "EASYPIX_INIT":
        await this.handleInit(payload.identifier, payload.config || {});
        break;
      case "EASYPIX_REFRESH":
        await this.refreshInstance(payload.identifier, false);
        break;
      default:
        break;
    }
  },

  async handleInit (identifier, config) {
    const directory = this.resolvePath(config.galleryPath);
    const includeSubdirectories = Boolean(config.includeSubdirectories);
    const reloadInterval = Number(config.galleryReloadInterval);

    this.instances.set(identifier, {
      directory,
      includeSubdirectories,
      reloadInterval: !isNaN(reloadInterval) && reloadInterval > 0 ? reloadInterval : null,
      timer: null
    });

    this.ensureRoute();
    await this.refreshInstance(identifier, true);
    this.setupReloadTimer(identifier);
  },

  setupReloadTimer (identifier) {
    const instance = this.instances.get(identifier);
    if (!instance) return;

    if (instance.timer) {
      clearInterval(instance.timer);
      instance.timer = null;
    }

    if (instance.reloadInterval && instance.reloadInterval >= 60 * 1000) {
      instance.timer = setInterval(() => {
        this.refreshInstance(identifier, false);
      }, instance.reloadInterval);
    }
  },

  async refreshInstance (identifier, logErrors) {
    const instance = this.instances.get(identifier);
    if (!instance) return;

    try {
      await access(instance.directory, fs.constants.R_OK);
    } catch (error) {
      const message = `MMM-EasyPix: Folder not accessible - ${instance.directory}`;
      this.sendSocketNotification("EASYPIX_ERROR", { identifier, message });
      if (logErrors) console.error(message);
      return;
    }

    try {
      const files = await this.collectFiles(instance.directory, instance.includeSubdirectories);
      this.sendSocketNotification("EASYPIX_FILE_LIST", { identifier, files });
    } catch (error) {
      const message = `MMM-EasyPix: ${error.message}`;
      this.sendSocketNotification("EASYPIX_ERROR", { identifier, message });
      if (logErrors) console.error(message);
    }
  },

  async collectFiles (directory, includeSubdirectories, relativePrefix = "") {
    const entries = await readdir(directory, { withFileTypes: true });
    let files = [];

    for (const entry of entries) {
      const currentPath = path.join(directory, entry.name);
      const relativePathRaw = relativePrefix ? path.join(relativePrefix, entry.name) : entry.name;
      const relativePath = relativePathRaw.split(path.sep).join("/");

      if (entry.isDirectory()) {
        if (includeSubdirectories) {
          const subFiles = await this.collectFiles(currentPath, includeSubdirectories, relativePathRaw);
          files = files.concat(subFiles);
        }
      } else if (entry.isFile()) {
        if (this.isSupported(currentPath)) {
          files.push(relativePath);
        }
      }
    }

    files.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
    return files;
  },

  isSupported (filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return SUPPORTED_EXTENSIONS.includes(ext);
  },

  resolvePath (inputPath) {
    if (!inputPath) {
      return path.join(this.path, "pix");
    }

    if (inputPath === "~") {
      return os.homedir();
    }

    if (inputPath.startsWith("~/")) {
      return path.join(os.homedir(), inputPath.slice(2));
    }

    if (path.isAbsolute(inputPath)) {
      return inputPath;
    }

    return path.resolve(this.path, inputPath);
  },

  ensureRoute () {
    if (this.routeInitialized) return;

    this.expressApp.get(`/${this.name}/local/:instanceId/*`, (req, res) => {
      const instanceId = req.params.instanceId;
      const instance = this.instances.get(instanceId);

      if (!instance) {
        res.status(404).send("Unknown MMM-EasyPix instance");
        return;
      }

      const requestedPath = req.params[0] || "";
      const safeRelative = path.normalize(requestedPath).replace(/^(\.\.(\/|\\|$))+/g, "");
      const absolutePath = path.join(instance.directory, safeRelative);

      if (!absolutePath.startsWith(instance.directory)) {
        res.status(400).send("Invalid path");
        return;
      }

      res.sendFile(absolutePath, (error) => {
        if (error) {
          console.error(`MMM-EasyPix failed to send ${absolutePath}: ${error.message}`);
        }
      });
    });

    this.routeInitialized = true;
  }
});
