/* global Module */

Module.register("MMM-EasyPix", {
  defaults: {
    picName: "face.gif", // .jpg, .gif, .png, etc. (animated gif's too!)
    maxWidth: "100%",
    updateInterval: 30 * 60 * 1000, // Updates display (in milliseconds) - Default: 30 minutes
    animationSpeed: 3000, // Speed of the update animation (in milliseconds).
    galleryPath: null, // Absolute or relative path to a folder with images (relative paths resolve from the module directory)
    includeSubdirectories: false,
    randomOrder: true,
    allowImmediateRepeats: false,
    galleryReloadInterval: 10 * 60 * 1000 // Refresh gallery list every 10 minutes
  },

  start () {
    this.imageUrl = null;
    this.files = [];
    this.currentIndex = -1;
    this.errorMessage = null;
    this.baseLocalUrl = `/${this.name}/local/${this.identifier}`;
    this.loaded = !this.config.galleryPath;

    if (this.config.galleryPath) {
      this.sendSocketNotification("EASYPIX_INIT", {
        identifier: this.identifier,
        config: {
          galleryPath: this.config.galleryPath,
          includeSubdirectories: this.config.includeSubdirectories,
          galleryReloadInterval: this.config.galleryReloadInterval
        }
      });
    } else {
      this.setStaticImage();
    }

    setInterval(() => {
      this.advanceImage();
      this.updateDom(this.config.animationSpeed || 0);
    }, this.config.updateInterval);

    // Trigger initial render
    this.advanceImage();
    this.updateDom(0);
  },

  getStyles () {
    return ["MMM-EasyPix.css"];
  },

  setStaticImage () {
    if (!this.config.picName) {
      this.imageUrl = null;
      return;
    }

    if (this.config.picName.startsWith("http")) {
      this.imageUrl = this.config.picName;
    } else {
      this.imageUrl = `/modules/MMM-EasyPix/pix/${this.config.picName}`;
    }
  },

  advanceImage () {
    if (!this.config.galleryPath) {
      return;
    }

    if (this.files.length === 0) {
      // Request a refresh if list is empty
      this.sendSocketNotification("EASYPIX_REFRESH", { identifier: this.identifier });
      return;
    }

    if (this.config.randomOrder) {
      if (this.files.length === 1) {
        this.currentIndex = 0;
      } else {
        let nextIndex = this.currentIndex;
        while (nextIndex === this.currentIndex) {
          nextIndex = Math.floor(Math.random() * this.files.length);
          if (this.config.allowImmediateRepeats) {
            break;
          }
        }
        this.currentIndex = nextIndex;
      }
    } else {
      this.currentIndex = (this.currentIndex + 1) % this.files.length;
    }

    const file = this.files[this.currentIndex];
    if (this.config.galleryPath.startsWith("http")) {
      const base = this.config.galleryPath.replace(/\/$/, "");
      const safeFile = file.replace(/\\/g, "/");
      this.imageUrl = `${base}/${safeFile}`;
    } else {
      const encoded = encodeURIComponent(file).replace(/%2F/g, "/");
      this.imageUrl = `${this.baseLocalUrl}/${encoded}`;
    }
    if (typeof Log !== "undefined" && Log.info) {
      Log.info(`[MMM-EasyPix] Next image: ${this.imageUrl}`);
    } else {
      console.log(`[MMM-EasyPix] Next image: ${this.imageUrl}`);
    }
  },

  socketNotificationReceived (notification, payload) {
    if (!payload || payload.identifier !== this.identifier) {
      return;
    }

    if (notification === "EASYPIX_FILE_LIST") {
      this.errorMessage = null;
      this.files = payload.files || [];
      this.currentIndex = -1;
      this.loaded = true;
      console.log(`[MMM-EasyPix] Received ${this.files.length} file(s)`);
      if (this.files.length > 0) {
        this.advanceImage();
      } else {
        this.imageUrl = null;
      }
      this.updateDom(this.config.animationSpeed || 0);
    }

    if (notification === "EASYPIX_ERROR") {
      this.errorMessage = payload.message;
      this.files = [];
      this.imageUrl = null;
      this.loaded = true;
      console.error(`[MMM-EasyPix] Error: ${payload.message}`);
      this.updateDom(this.config.animationSpeed || 0);
    }
  },

  getDom () {
    const wrapper = document.createElement("div");

    if (!this.loaded) {
      wrapper.className = "dimmed small";
      wrapper.innerHTML = "Loading photos...";
      return wrapper;
    }

    if (this.errorMessage) {
      wrapper.className = "normal medium";
      wrapper.innerHTML = this.errorMessage;
      return wrapper;
    }

    if (!this.imageUrl) {
      wrapper.className = "dimmed small";
      wrapper.innerHTML = "No photos available.";
      return wrapper;
    }

    const image = document.createElement("img");
    image.src = this.imageUrl;
    image.className = "mmm-easypix-photo";
    image.style.maxWidth = this.config.maxWidth;
    wrapper.appendChild(image);
    return wrapper;
  }
});
