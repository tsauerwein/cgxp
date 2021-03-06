/**
 * Copyright (c) 2008-2009 The Open Source Geospatial Foundation
 *
 * Published under the BSD license.
 * See http://svn.geoext.org/core/trunk/geoext/license.txt for the full text
 * of the license.
 */

/**
 * @include ux/control/StreetViewClick.js
 */

/** api: (define)
 *  module = GeoExt.ux
 *  class = StreetViewPanel
 *  base_link = `Ext.Panel <http://extjs.com/deploy/dev/docs/?class=Ext.Panel>`_
 */
Ext.namespace('GeoExt.ux');

/** private: property[scriptSourceStreetView]
 *  ``String``  Source of this script: complete URL
 */
var scriptSourceStreetView = (function() {
    var scripts = document.getElementsByTagName('script'),
            script = scripts[scripts.length - 1];

    if (script.getAttribute.length !== undefined) {
        return script.src;
    }

    return script.getAttribute('src', -1);
}());

GeoExt.ux.StreetViewPanel = Ext.extend(Ext.Panel, {

    /** api: config[map]
     *  ``OpenLayers.Map``  A configured map
     */
    /** private: property[map]
     *  ``OpenLayers.Map``  The map object.
     */
    map: null,

    /** private: property[panorama]
     *  ``google.maps.StreetViewPanorama``  The panorama object. A StreetviewPanorama object.
     */
    panorama: null,

    /** private: property[streetviewservice]
     *  ``google.maps.StreetViewService``  The Street View Client object. A google.maps.StreetViewService object performs searches for Street View data based on parameters that are passed to its methods.
     */
    streetviewservice: null,

    /** api: config[clickMode]
     *  ``Boolean``  Defines if the panorama is selected through a click in the map
     */
    /** private: property[clickMode]
     *  ``Boolean``  Is click mode active ?
     */
    clickMode: true,

    /** api: config[videoMode]
     *  ``Boolean``  Defines if the video mode is activated.
     */
    /** private: property[videoMode]
     *  ``Boolean``  Is video mode active ?
     */
    videoMode: true,

    /** api: config[videoTimeInterval]
     *  ``Boolean``  Defines the time in millisecond between the move during video mode.
     */
    /** private: property[videoTimeInterval]
     *  ``Boolean``  videoInterval
     */
    videoTimeInterval: 2500,

    /** api: config[showTool]
     *  ``Boolean``  Defines if the 2D tool is shown in the map
     */
    /** private: property[showTool]
     *  ``Boolean``  Is tool visible ?
     */
    showTool: true,

    /** api: config[showLinks]
     *  ``Boolean``  Defines if the panorama links are represented in the map
     */
    /** private: property[showLinks]
     *  ``Boolean``  Are link(s) visible ?
     */
    showLinks: true,

    /** api: config[yaw]
     *  ``Number``  The camera yaw in degrees relative to true north. True north is 0 degrees, east is 90 degrees, south is 180 degrees, west is 270 degrees.
     */
    /** private: property[yaw]
     *  ``Number``  Camery yaw
     */
    yaw: 0,

    /** api: config[pitch]
     *  ``Number``  The camera pitch in degrees, relative to the street view vehicle. Ranges from 90 degrees (directly upwards) to -90 degrees (directly downwards).
     */
    /** private: property[pitch]
     *  ``Number``  Camery pitch
     */
    pitch: 0,

    /** api: config[zoom]
     *  ``Number``  The zoom level. Fully zoomed-out is level 0, zooming in increases the zoom level.
     */
    /** private: property[zoom]
     *  ``Number``  Panorama zoom level
     */
    zoom: 0,

    /** api: config[panoramaLocation]
     *  ``google.maps.LatLng``  The panorama location
     */
    /** private: property[panoramaLocation]
     *  ``google.maps.LatLng``  Panorama location
     */
    panoramaLocation: null,

    /** api: config[readPermalink]
     *  ``Boolean``  Read the permalink in the url if presents
     */
    /** private: property[readPermalink]
     *  ``Boolean``  Read the permalink in the url if presents
     */
    readPermalink: true,

    /** private: property[radius]
     *  ``Number``  The radius to search for panorama around.
     */
    radius: 50,

    /** api: config[baseUrl]
     *  ``Boolean``  base url of this directory resources necessary to get the images (directory containing resources). Has to be set if this file is integrated in a JS build.
     */
    /** private: property[baseUrl]
     *  ``String``  base url of this directory resources necessary to get the images
     */
    baseUrl: scriptSourceStreetView.replace('/ux/widgets/StreetViewPanel.js', ''),

    /** i18n */
    title: 'Google Street View',
    noPanorama: 'No panorama found near this position. You have to click elsewhere.',
    iserverError: 'Server error',
    unexpectedProblem: 'Unexpected problem',

    /** private: method[initComponent]
     *  Private initComponent override.
     */
    initComponent : function() {
        var defConfig = {
            plain: true,
            border: false
        };

        Ext.applyIf(this, defConfig);

        GeoExt.ux.StreetViewPanel.superclass.initComponent.call(this);
    },

    /** private: method[afterRender]
     *  Private afterRender override.
     *  Creates a Street View Panorame Instance See: http://code.google.com/intl/fr/apis/maps/documentation/reference.html#GStreetviewPanorama
     *  This methods add functions to the Street View Panorama (this.panorama):
     *  - getPermalink(complete): get the permalink parameters
     */
    afterRender : function() {
        if (this.ownerCt) {
            var wh = this.ownerCt.getSize();
            Ext.applyIf(this, wh);
        }
        GeoExt.ux.StreetViewPanel.superclass.afterRender.call(this);

        // Create StreetViewService for querying information about panorama
        this.streetviewservice = new google.maps.StreetViewService();

        // Configure panorama and associate methods and parameters to it
        this.panorama = new google.maps.StreetViewPanorama(this.body.dom);
        this.panorama.map = this.map;
        this.panorama.yaw = this.yaw;
        this.panorama.pitch = this.pitch;
        this.panorama.zoom = this.zoom;
        this.panorama.showTool = this.showTool;
        this.panorama.showLinks = this.showLinks;
        this.panorama.clickMode = this.clickMode;
        this.panorama.videoMode = this.videoMode;
        this.panorama.streetviewservice = this.streetviewservice;
        this.panorama.videoPlay = false;
        this.panorama.videoReady = true;
        this.panorama.videoTimeInterval = this.videoTimeInterval;
        this.panorama.panoramaLocation = this.panoramaLocation;
        this.panorama.transitionYaw = null;

        // Draw navigation tool in map
        this.panorama.drawNavigationTool = function(panorama, position) {
            // Destroy the existing features
            panorama.navigationToolLayer.destroyFeatures();
            // Compute the new position
            var circlePosition = new OpenLayers.Geometry.Point(position.lng(), position.lat());
            circlePosition.transform(new OpenLayers.Projection("EPSG:4326"), panorama.map.getProjectionObject());
            // Add a vector feature in navigation layer
            panorama.navigationTool = new OpenLayers.Feature.Vector(circlePosition, {yaw: panorama.yaw});
            panorama.navigationToolLayer.addFeatures([panorama.navigationTool]);
        };

        this.panorama.getPermalink = function(complete) {
            var permalink;
            if (complete) {
                permalink = window.location.href;
                if (OpenLayers.String.contains(permalink, '?')) {
                    var end = permalink.indexOf('?');
                    permalink = permalink.substring(0, end);
                }
                permalink = permalink + "?";
            } else {
                permalink = '';
            }
            permalink = permalink + "yaw=" + this.yaw;
            permalink = permalink + "&pitch=" + this.pitch;
            permalink = permalink + "&panoZoom=" + this.zoom;
            permalink = permalink + "&clickMode=" + this.clickMode;
            permalink = permalink + "&videoTimeInterval=" + this.videoTimeInterval;
            permalink = permalink + "&showTool=" + this.showTool;
            permalink = permalink + "&showLinks=" + this.showLinks;
            if (this.map) {
                permalink = permalink + "&easting=" + this.map.getCenter().lon;
                permalink = permalink + "&northing=" + this.map.getCenter().lat;
                permalink = permalink + "&zoom=" + this.map.getZoom();
            }
            if (this.navigationTool) {
                permalink = permalink + "&panoEasting=" + this.navigationTool.geometry.x;
                permalink = permalink + "&panoNorthing=" + this.navigationTool.geometry.y;
            }
            return permalink;
        };

        // String to boolean function
        this.panorama.stringToBoolean = function(string) {
            switch (string.toLowerCase()) {
                case "true": case "yes": case "1": return true;
                case "false": case "no": case "0": case null: return false;
                default: return Boolean(string);
            }
        };

        this.panorama.setPermalink = function(parameters) {
            if (parameters.easting && parameters.northing) {
                var position = new OpenLayers.LonLat(parseFloat(parameters.easting), parseFloat(parameters.northing));
                if (this.map) {
                    this.map.setCenter(position);
                }
            }
            if (parameters.zoom) {
                if (this.map) {
                    this.map.zoomTo(parseInt(parameters.zoom, 10));
                }
            }
            if (parameters.yaw) {
                this.yaw = parseFloat(parameters.yaw);
            }
            if (parameters.pitch) {
                this.pitch = parseFloat(parameters.pitch);
            }
            if (parameters.panoZoom) {
                this.zoom = parseInt(parameters.panoZoom, 10);
            }
            if (parameters.clickMode) {
                this.clickMode = this.stringToBoolean(parameters.clickMode);
            }
            if (parameters.videoTimeInterval) {
                this.videoTimeInterval = parseFloat(parameters.videoTimeInterval);
            }
            if (parameters.showTool) {
                this.showTool = this.stringToBoolean(parameters.showTool);
            }
            if (parameters.showLinks) {
                this.showLinks = this.stringToBoolean(parameters.showLinks);
            }
            if (parameters.panoEasting && parameters.panoNorthing) {
                var positionPano = new OpenLayers.LonLat(parseFloat(parameters.panoEasting), parseFloat(parameters.panoNorthing));
                positionPano.transform(this.map.getProjectionObject(), new OpenLayers.Projection("EPSG:4326"));
                var featurePosition = new google.maps.LatLng(positionPano.lat, positionPano.lon);
                this.panoramaLocation = featurePosition;
            }
            this.setPov({
                heading: this.yaw,
                pitch: this.pitch,
                zoom: this.zoom
            });
        };

        // Set the permalink
        if (this.readPermalink) {
            var parameters = OpenLayers.Util.getParameters();
            this.panorama.setPermalink(parameters);
        }

        // Draw link in map
        this.panorama.drawLinkTool = function(panorama, position, links) {
            // Destroy the existing features
            panorama.navigationLinkLayer.destroyFeatures();
            // Add new link symbols
            panorama.navigationLinks = [];
            for (var i = 0; i < links.length; i++) {
                var link = links[i];
                var centerPosition = new OpenLayers.Geometry.Point(position.lng(), position.lat());
                centerPosition.transform(new OpenLayers.Projection("EPSG:4326"), panorama.map.getProjectionObject());
                // Add a vector feature as navigation link
                panorama.navigationLinks.push(new OpenLayers.Feature.Vector(centerPosition, {angle: link.heading, panoId: link.pano}));
            }
            if (panorama.navigationLinks.length > 0) {
                panorama.navigationLinkLayer.addFeatures(panorama.navigationLinks);
            }
        };

        // Add panorama event listeners
        google.maps.event.addListener(this.panorama, "pov_changed", function() {
            // This is the panorama
            if (this.showTool) {
                if (this.navigationTool) {
                    this.navigationTool.attributes.yaw = this.getPov().heading;
                    if (this.navigationTool.layer) {
                        this.navigationTool.layer.drawFeature(this.navigationTool);
                    }
                }
            }
            this.yaw = this.getPov().heading;
            this.pitch = this.getPov().pitch;
        });
        google.maps.event.addListener(this.panorama, "zoom_changed", function() {
            this.zoom = this.getZoom();
        });
        google.maps.event.addListener(this.panorama, "position_changed", function() {
            this.drawNavigationTool(this, this.getPosition());
        });
        google.maps.event.addListener(this.panorama, "links_changed", function() {
            this.drawLinkTool(this, this.getPosition(), this.getLinks());
        });

        var self = this;
        // Callback to manage panorama when used with getNearestPanorama
        this.panorama.callback = function (data, status) {
            this.deleteFeatures = function() {
                if (this.panorama.showTool) {
                    if (this.panorama.map) {
                        this.panorama.navigationToolLayer.destroyFeatures();
                    }
                }
                if (this.panorama.showLinks) {
                    if (this.panorama.map) {
                        this.panorama.navigationLinkLayer.destroyFeatures();
                    }
                }
            };
            if (status != google.maps.StreetViewStatus.OK) {
                this.deleteFeatures();
                if (this.panorama.videoMode && this.panorama.videoPlay) {
                    this.panorama.videoReady = true;
                    this.panorama.videoPlay = false;
                    clearInterval(this.panorama.videoInterval);
                }
                Ext.MessageBox.alert(self.title,
                    status == google.maps.StreetViewStatus.ZERO_RESULTS ?
                    self.noPanorama: self.unexpectedProblem
                );
            } else {
                if (this.panorama.transitionYaw) {
                    this.panorama.transitionYaw = null;
                } else {
                    var POV = {
                        heading: this.panorama.yaw || 0,
                        pitch: this.panorama.pitch || 0,
                        zoom: this.panorama.zoom || 0
                    };
                    this.panorama.setPano(data.location.pano);
                    this.panorama.setPov(POV);
                }
                // Add the navigation tool
                if (this.panorama.showTool) {
                    if (this.panorama.map) {
                        this.panorama.drawNavigationTool(this.panorama, data.location.latLng);
                    }
                }
                // Add the links
                if (this.panorama.showLinks) {
                    if (this.panorama.map) {
                        this.panorama.drawLinkTool(this.panorama, data.location.latLng, data.links);
                    }
                    if (this.panorama.videoMode) {
                        this.panorama.previousDifferenceVideo = 361;
                        if (this.panorama.navigationLinks.length > 0 && this.panorama.previousYawVideo) {
                            for (var i = 0; i < this.panorama.navigationLinks.length; i++) {
                                var difference = this.panorama.navigationLinks[i].attributes.angle - this.panorama.previousYawVideo;
                                if (difference < -180) {
                                    difference = difference + 360;
                                }
                                if (difference > 180) {
                                    difference = difference - 360;
                                }
                                if (Math.abs(difference) < this.panorama.previousDifferenceVideo) {
                                    this.panorama.previousDifferenceVideo = Math.abs(difference);
                                    this.panorama.nextFeature = this.panorama.navigationLinks[i];
                                }
                            }
                            this.panorama.videoReady = true;
                            //console.log("callback: previousDifferenceVideo" + this.panorama.previousDifferenceVideo)
                            //console.log("callback: nextYaw: "+ this.panorama.nextFeature.attributes.angle);
                        } else {
                            this.panorama.videoReady = true;
                            clearInterval(this.panorama.videoInterval);
                        }
                    }
                }
            }
        };

        // Callback to manage panorama when used with getPanoramaById
        this.panorama.callbackDrawTools = function (data) {
            this.deleteFeatures = function() {
                if (this.showTool) {
                    if (this.map) {
                        this.navigationToolLayer.destroyFeatures();
                    }
                }
                if (this.showLinks) {
                    if (this.map) {
                        this.navigationLinkLayer.destroyFeatures();
                    }
                }
            };
            if (data) {
                if (data.code == 600) {
                    this.deleteFeatures();
                    Ext.MessageBox.alert(self.title, self.noPanorama)
                } else if (data.code == 500) {
                    this.deleteFeatures();
                    Ext.MessageBox.alert(self.title, self.serverError)
                } else if (data.code == 200) {
                    // Add the navigation tool
                    if (this.showTool) {
                        if (this.map) {
                            this.drawNavigationTool(this, data.location.latLng);
                        }
                    }
                    // Add the links
                    if (this.showLinks) {
                        if (this.map) {
                            this.drawLinkTool(this, data.location.latLng, data.links);
                        }
                    }
                } else {
                    this.deleteFeatures();
                    Ext.MessageBox.alert(self.title, self.unexpectedProblem)
                }
            }
        };

        // Set initial position of panorama
        if (this.panorama.panoramaLocation) {
            //console.log('panorama location init');
            this.streetviewservice.getPanoramaByLocation(this.panorama.panoramaLocation, this.radius, this.panorama.callback.createDelegate(this));
        }

        // Add features associated to map
        if (this.map) {
            if (this.clickMode) {
                this.clickControl = new GeoExt.ux.StreetViewClick({
                    handlerOptions: {
                        "single": true
                    },
                    radius: this.radius,
                    panorama: this.panorama,
                    streetviewservice: this.streetviewservice
                });
                this.map.addControl(this.clickControl);
                this.clickControl.activate();
            }
            // Add the 2D navigation tool in the map
            if (this.showTool) {
                this.panorama.navigationToolLayer = new OpenLayers.Layer.Vector("2DNavigationTool", {
                    displayInLayerSwitcher: false,
                    styleMap: new OpenLayers.StyleMap({
                        "default": {
                            externalGraphic: this.baseUrl + "/resources/tool.png",
                            graphicHeight: 32,
                            graphicWidth: 32,
                            graphicOpacity: 0.8,
                            rotation: "${yaw}"
                        },
                        "select": {
                            cursor: "pointer"
                        }
                    })
                });
                this.map.addLayer(this.panorama.navigationToolLayer);
                this.dragControl = new OpenLayers.Control.DragFeature(this.panorama.navigationToolLayer, {
                    doneDragging: function(pixel) {
                        var position = this.panorama.map.getLonLatFromPixel(pixel);
                        position.transform(this.panorama.map.getProjectionObject(), new OpenLayers.Projection("EPSG:4326"));
                        var featurePosition = new google.maps.LatLng(position.lat, position.lon);

                        //console.log('dragging feature');
                        this.streetviewservice.getPanoramaByLocation(featurePosition, this.radius, this.panorama.callback.createDelegate(this));
                    },
                    moveFeature: function(pixel) {
                        //alert(pixel);
                    },
                    panorama: this.panorama,
                    streetviewservice: this.streetviewservice
                });
                this.map.addControl(this.dragControl);
                this.dragControl.activate();
            }
            // Add the links in the map
            if (this.showLinks) {
                this.panorama.navigationLinkLayer = new OpenLayers.Layer.Vector("2DNavigationLink", {
                    displayInLayerSwitcher: false,
                    styleMap: new OpenLayers.StyleMap({
                        "default": {
                            externalGraphic: this.baseUrl + "/resources/link.png",
                            graphicHeight: 24,
                            graphicWidth: 16.5,
                            graphicYOffset: -44,
                            graphicOpacity: 0.8,
                            rotation: "${angle}"
                        },
                        "select": {
                            cursor: "pointer",
                            externalGraphic: this.baseUrl + "/resources/link_selected.png"
                        }
                    })
                });
                this.map.addLayer(this.panorama.navigationLinkLayer);
                this.selectControl = new OpenLayers.Control.SelectFeature(this.panorama.navigationLinkLayer, {
                    hover: true,
                    clickFeature: function(feature) {
                        if (this.panorama.videoMode) {
                            // Play the panorama in video mode
                            this.playVideo = function() {
                                this.panorama.previousYawVideo = feature.attributes.angle;

                                if (this.panorama.nextFeature) {
                                    feature = this.panorama.nextFeature;
                                    this.panorama.previousYawVideo = feature.attributes.angle;
                                }
                                this.panorama.transitionYaw = feature.attributes.angle;
                                //console.log("PlayVideo: previousYawVideo: "+ this.panorama.previousYawVideo);
                                if (this.panorama.videoReady) {
                                    //console.log('play video: mode auto');
                                    this.streetviewservice.getPanoramaById(feature.attributes.panoId, this.panorama.callback.createDelegate(this));
                                    this.panorama.setPano(feature.attributes.panoId);
                                    this.panorama.videoReady = false;
                                }
                            };
                            // Manage the start and stop of the video
                            if (!this.panorama.videoPlay) {
                                //console.log("Start Play Video");
                                this.panorama.videoPlay = true;
                                this.panorama.videoInterval = setInterval(this.playVideo.createDelegate(this), this.panorama.videoTimeInterval);
                                this.playVideo();
                            } else {
                                //console.log("Stop Play Video");
                                this.panorama.nextFeature = null;
                                this.panorama.transitionYaw = null;
                                clearInterval(this.panorama.videoInterval);
                                this.panorama.videoPlay = false;
                            }
                        } else {
                            //console.log('play video: mode manuel');
                            this.panorama.transitionYaw = feature.attributes.angle;
                            this.streetviewservice.getPanoramaById(feature.attributes.panoId, this.panorama.callback.createDelegate(this));
                        }
                    },
                    allowSelection: true,
                    panorama: this.panorama,
                    streetviewservice: this.streetviewservice
                });
                this.map.addControl(this.selectControl);
                this.selectControl.activate();
            }
        }
    },

    /** private: method[beforeDestroy]
     *  Destroy Street View Panorama instance and navigation tools
     *
     */
    beforeDestroy: function() {
        if (this.clickMode) {
            if (this.map) {
                this.clickControl.deactivate();
                this.map.removeControl(this.clickControl);
            }
        }
        if (this.showTool) {
            if (this.map) {
                this.dragControl.deactivate();
                this.map.removeControl(this.dragControl);
                this.map.removeLayer(this.panorama.navigationToolLayer);
                this.panorama.navigationToolLayer.destroy();
            }
        }
        if (this.showLinks) {
            if (this.map) {
                this.selectControl.deactivate();
                this.map.removeControl(this.selectControl);
                this.map.removeLayer(this.panorama.navigationLinkLayer);
                this.panorama.navigationLinkLayer.destroy();
            }
        }
        delete this.panorama;
        GeoExt.ux.StreetViewPanel.superclass.beforeDestroy.apply(this, arguments);
    }

});

/** api: xtype = gxux_streetviewpanel */
Ext.reg('gxux_streetviewpanel', GeoExt.ux.StreetViewPanel);
