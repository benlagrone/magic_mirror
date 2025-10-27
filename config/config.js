let config = {
  address: "0.0.0.0",
  port: 8081,
  basePath: "/",
  ipWhitelist: [],
  useHttps: false,
  httpsPrivateKey: "",
  httpsCertificate: "",
  language: "en",
  locale: "en-US",
  logLevel: ["INFO", "LOG", "WARN", "ERROR"],
  timeFormat: 24,
  units: "metric",

  modules: [
    {
      module: "alert"
    },
    {
      module: "updatenotification",
      position: "top_bar"
    },
    {
      module: "clock",
      position: "top_left",
      config: {
      "timezone":"America/Chicago"
      }
    },
    // {
    //   module: "calendar",
    //   header: "US Holidays",
    //   position: "top_left",
    //   config: {
    //     calendars: [
    //       {
    //         fetchInterval: 7 * 24 * 60 * 60 * 1000,
    //         symbol: "calendar-check",
    //         url: "https://ics.calendarlabs.com/76/mm3137/US_Holidays.ics"
    //       }
    //     ]
    //   }
    // },
    // {
    //   module: "compliments",
    //   position: "lower_third"
    // },
    {
      module: "weather",
      position: "top_right",
      config: {
        weatherProvider: "openmeteo",
        type: "current",
        lat: 29.777764,
        lon: -95.5262739
      }
    },
    {
      module: "weather",
      position: "top_right",
      header: "Weather Forecast",
      config: {
        weatherProvider: "openmeteo",
        type: "forecast",
        lat: 29.777764,
        lon: -95.5262739
      }
    },
    // {
    //   module: "newsfeed",
    //   position: "bottom_bar",
    //   config: {
    //     feeds: [
    //       {
    //         title: "New York Times",
    //         url: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml"
    //       }
    //     ],
    //     showSourceTitle: true,
    //     showPublishDate: true,
    //     broadcastNewsFeeds: true,
    //     broadcastNewsUpdates: true
    //   }
    // },
    {
      module: "MMM-Dad-Jokes",
      position: "bottom_right",
      config: {
        updateInterval: 30 * 60 * 1000,
        fadeSpeed: 4 * 1000,
        fontSize: "1.7rem",
        textAlign: "left"
      }
    },
    {
      module: "MMM-SolarPicture",
      position: "top_center",
      config: {
        imageType: "AIA 304",
        updateInterval: 60 * 60 * 1000,
        maxMediaWidth: 400,
        maxMediaHeight: 400
      }
    },
    {
      module: "MMM-GooglePhotos",
      position: "top_center",
      config: {
        localAlbumName: "GalleryDen2",
        localScanInterval: 10 * 60 * 1000,
        updateInterval: 60 * 1000,
        showWidth: 800,
        showHeight: 600
      }
    },
    // {
    //   module: "MMM-PreciousMetals",
    //   header: "Precious Metals",
    //   position: "top_center",
    //   config: {
    //     apiKey: "MDXNUPXAORCFW5VREG5E939VREG5E",
    //     metals: ["gold", "silver"],
    //     updateInterval: 3 * 60 * 60 * 1000
    //   }
    // },
    {
      module: "MMM-Pollen",
      header: "Pollen Forecast",
      position: "top_left",
      config: {
        updateInterval: 3 * 60 * 60 * 1000,
        zip_code: "77024"
      }
    },
    {
      module: "MMM-SolomonicPrayerClock",
      position: "bottom_left",
      config: {
        latitude: 29.7604,
        longitude: -95.3698,
        rotationIntervalSeconds: 30,
        theme: "expanded",
        showSigils: true,
        showUpcoming: false,
        psalmDisplayMode: "cycle",
        focusAreas: ["wisdom", "wealth", "health", "influence"],
        locale: "en"
      }
    }
  ]
};

if (typeof module !== "undefined") {
  module.exports = config;
}
