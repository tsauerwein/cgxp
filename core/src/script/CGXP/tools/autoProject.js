/**
* Copyright (c) 2011-2014 by Camptocamp SA
*
* CGXP is free software: you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.
*
* CGXP is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License
* along with CGXP. If not, see <http://www.gnu.org/licenses/>.
*/

/**
* @requires OpenLayers/BaseTypes/Class.js
* @requires OpenLayers/Util.js
* @include OpenLayers/Map.js
*/

OpenLayers.AutoProjection = OpenLayers.Class({
    initialize: function(config) {
        this.buildProjectionList(config);
        if (this.projections.length > 1){
           this.isEnabled = true;
        } else { 
           this.isEnabled = false;
        }
    },

    /** private: property[projections]
     *  List of OpenLayers.Projection object
     *  used to reproject some coordinates. It's based
     *  on projectionCodes
     */
    projections: null,

    /** private: method[buildProjectionList]
     *  :arg config: ``Object`` the object containing projection Codes
     *
     *  Take a list of projection codes in config.projectionCodes
     *  and fill the projections dictionary with Openlayers.Projection
     *  objects.
     */
    buildProjectionList: function(config){
        this.projections = [];
        if (!config.projectionCodes) {
            return;
        }
        for (var i = 0, len = config.projectionCodes.length, code; i < len; i++)
            {
            code = String(config.projectionCodes[i]).toUpperCase();
            if (code.substr(0, 5) != "EPSG:") {
                code = "EPSG:" + code;
            }
            this.projections[i] = new OpenLayers.Projection(code);
        }
        return;
    },

    /** private: method[tryProjection]
     *  :arg point: ``Array`` point to project
     *  :arg map: ``Object`` the map object
     *
     *  Project the point using the projections list
     *  and find the first projection for which the it
     *  falls inside the map.restrictedExtent.
     */
    tryProjection: function(point, map) {
        if (!this.isEnabled){
            return point; 
        }
        var projectedPoint = point; 
        for (var i=0; i < this.projections.length; ++i) {
            var projection = this.projections[i];
            var position = new OpenLayers.LonLat(point[0], point[1]);
            position.transform(projection, map.projection);
            if (map.restrictedExtent.containsLonLat(position)) {
                projectedPoint[0] = position.lon;
                projectedPoint[1] = position.lat;
                break;
            }
        }
        return projectedPoint;
    },

    CLASS_NAME: "OpenLayers.AutoProjection"
});
