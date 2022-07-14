const gpxServer = "https://livecapture-420.s3.amazonaws.com/";
const apiServer = "https://stage.addyourtour.com:8443/gpx/";
class AudioPlayer extends HTMLElement {
  constructor() {
    super();
    this.map = null;
    this.geoCoordinates = [];
    this.audioFile = null;
    this.startCoordinates = [];
    this.marker = null;
    this.wavesurfer = null;
    this.currentTime = 0;
    this.nameKey = "";
    this.mapCoordinates = [];
    this.langIndexCount = 0;
    this.totalNoOfSeconds = 0;
  }
  async loadMap(nameInUrl) {
    this.currentTime = 0;
    await fetch(`${apiServer}`, {
      method: "GET",
    })
      .then(async (response) => await response.json())
      .then(async (json) => {
        this.mapCoordinates = [];
        var element = document.getElementById("geoDataSelect");
        for (var data of json.files) {
          var opt = document.createElement("option");
          opt.value = data.name;
          opt.innerHTML = data.name;
          if (this.langIndexCount == 0) {
            this.nameKey = data.name;
          }
          if (data.name) {
            element.appendChild(opt);
          }
          this.langIndexCount++;
        }
        if (nameInUrl) {
          this.nameKey = nameInUrl;
          element.value = nameInUrl;
        }
        this.audioFile = `${gpxServer}${this.nameKey}.mp3`;
        this.mapCoordinates.push(this.nameKey.split("_")[3]);
        this.mapCoordinates.push(this.nameKey.split("_")[2]);
        await $.getJSON(`${gpxServer}${this.nameKey}.json`, async (data) => {
          this.geoCoordinates = [];
          this.startCoordinates = [];
          for (var key in data.features) {
            let coordinates = data.features[key].geometry
              ? data.features[key].geometry.coordinates
              : [];
            this.geoCoordinates[key] = coordinates;
            if (key == 0) {
              this.startCoordinates = coordinates;
            }
          }
        });
      });

    mapboxgl.accessToken =
      "pk.eyJ1Ijoid3d3bWFzdGVyMSIsImEiOiJjazZmbmxhYngwYjQxM2xtdDdwMjJzYjdnIn0._QtAdUTg9NtC9_R8Caq6Ng";
    this.map = new mapboxgl.Map({
      container: "map",
      style: "mapbox://styles/mapbox/dark-v10",
      center: this.mapCoordinates,
      zoom: 15,
    });
    document.getElementById("noOfPoint").innerHTML = this.geoCoordinates.length;
    await this.map.on("load", () => {
      this.map.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: this.geoCoordinates,
          },
        },
      });
      this.map.addLayer({
        id: "route",
        type: "line",
        source: "route",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#1E90FF",
          "line-width": 8,
        },
      });
    });

    this.marker = new mapboxgl.Marker()
      .setLngLat(this.startCoordinates)
      .addTo(this.map);

    this.wavesurfer = WaveSurfer.create({
      container: "#waveform",
      waveColor: "#F5F5DC",
      progressColor: "#77bbff",
      barHeight: 2,
      normalize: true,
      barWidth: 3,
    });

    this.wavesurfer.load(this.audioFile);
    //this.wavesurfer.load("./sample.mp3");
    document.getElementById("waveformDiv").style.display = "block";

    /* User enter mouse on map features */
    this.map.on("mouseenter", "route", () => {
      this.map.getCanvas().style.cursor = "pointer";
    });

    /* User leave mouse on map features */
    this.map.on("mouseleave", "route", () => {
      this.map.getCanvas().style.cursor = "";
    });

    /* When user click on map */
    this.map.on("click", "route", (e) => {
      let clickedPoints = [];
      clickedPoints.push(e.lngLat.wrap().lng);
      clickedPoints.push(e.lngLat.wrap().lat);

      const addAbsDelta = (g) => (s, v, i) => s + Math.abs(v - g[i]);

      var goal = clickedPoints,
        result = this.geoCoordinates.reduce((a, b) =>
          a.reduce(addAbsDelta(goal), 0) < b.reduce(addAbsDelta(goal), 0)
            ? a
            : b
        );

      let slectedIndex = 0;
      for (var i = 0; i < this.geoCoordinates.length; i++) {
        if (
          this.geoCoordinates[i][0] == result[0] &&
          this.geoCoordinates[i][1] == result[1]
        ) {
          slectedIndex = i;
          break;
        }
      }
      this.marker.remove();
      this.marker = new mapboxgl.Marker().setLngLat(result).addTo(this.map);
      this.wavesurfer.play();
      this.wavesurfer.play(slectedIndex, this.totalNoOfSeconds);
      document.getElementById("playPauseIcon").classList.remove("fa-play");
      document.getElementById("playPauseIcon").classList.add("fa-pause");
    });

    this.wavesurfer.on("audioprocess", (e) => {
      var newTime = Math.round(this.wavesurfer.getCurrentTime());
      if (typeof newTime !== "undefined" && this.currentTime !== newTime) {
        this.currentTime = newTime;
      }

      document.getElementById("runAudioTime").innerHTML = new Date(
        newTime * 1000
      )
        .toISOString()
        .substr(11, 8);

      this.marker.remove();
      if (this.geoCoordinates[newTime]) {
        this.marker = new mapboxgl.Marker()
          .setLngLat(this.geoCoordinates[newTime])
          .addTo(this.map);
      }
    });

    this.wavesurfer.on("finish", (e) => {
      document.getElementById("playPauseIcon").classList.remove("fa-pause");
      document.getElementById("playPauseIcon").classList.add("fa-play");
    });

    this.wavesurfer.on("ready", (e) => {
      let audioTime = Math.round(this.wavesurfer.getDuration());
      this.totalNoOfSeconds = audioTime;
      document.getElementById("noOfSeconds").innerHTML = audioTime;

      document.getElementById("fullAudioTime").innerHTML = new Date(
        audioTime * 1000
      )
        .toISOString()
        .substr(11, 8);
      document.getElementById("runAudioTime").innerHTML = "00:00:00";
      document.getElementById("playPause").style.display = "block";
      document.getElementById("timeCounter").style.display = "block";
      document.getElementById("selectData").style.display = "block";
      document.getElementById("pointSecond").style.display = "block";
    });
  }

  async connectedCallback() {
    var appUrl = await window.location.href;
    var nameInUrl = await appUrl.split("#")[1];
    if (nameInUrl) {
      nameInUrl = nameInUrl;
    } else {
      nameInUrl = "";
    }
    await this.loadMap(nameInUrl);
    document.querySelector("#playPause").addEventListener("click", async () => {
      if (this.wavesurfer.isPlaying()) {
        this.wavesurfer.pause();
        document.getElementById("playPauseIcon").classList.remove("fa-pause");
        document.getElementById("playPauseIcon").classList.add("fa-play");
      } else {
        this.wavesurfer.play();
        document.getElementById("playPauseIcon").classList.remove("fa-play");
        document.getElementById("playPauseIcon").classList.add("fa-pause");
      }
    });

    document
      .querySelector("#geoDataSelect")
      .addEventListener("change", async () => {
        let sel = document.querySelector("#geoDataSelect");
        this.nameKey = sel.options[sel.selectedIndex].value;
        window.history.pushState({}, "", "#" + this.nameKey);
        document.getElementById("playPause").style.display = "none";
        document.getElementById("timeCounter").style.display = "none";
        document.getElementById("pointSecond").style.display = "none";
        document.getElementById("playPauseIcon").classList.remove("fa-pause");
        document.getElementById("playPauseIcon").classList.add("fa-play");
        this.wavesurfer.destroy();
        this.map.remove();
        await this.loadMap("");
      });
  }
}

/* Load  AudioPlayer class*/
window.customElements.define("audio-player", AudioPlayer);
