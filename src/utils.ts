module powerbi.extensibility.visual {
    /**
     * Gets property value for a particular object.
     *
     * @function
     * @param {DataViewObjects} objects - Map of defined objects.
     * @param {string} objectName       - Name of desired object.
     * @param {string} propertyName     - Name of desired property.
     * @param {T} defaultValue          - Default value of desired property.
    */
    export function getArrayValues(dataPoints: any[], datacount: number, forwardtop: boolean) {
        let _datasort = null;
        if (forwardtop) {
            _datasort = dataPoints.sort(function (a, b) {
                return a.value < b.value ? 1 : -1
            });
        } else {
            _datasort = dataPoints.sort(function (a, b) { return a.value > b.value ? 1 : -1 });
        }

        let _returndata = [];
        _datasort.forEach(function (_datapoint: any, index: number) {
            if (index < datacount)
                _returndata.push(_datapoint)
        });
        return _returndata;
    }


    export function getStartPoint(showFromLeftSide: boolean, width: number, height: number) {
        if (showFromLeftSide)
            return { x: 5, y: 5 };
        else
            return { x: width - 5, y: 5 };
    }
    export function getAreaPath(d:any, i :number, _XScale:any,startpoint:any) {
        let _realvalue = _XScale(<number>d.value);
        let _points = [];
        let _start_x = startpoint.x;
        let _start_y = startpoint.y;
        _points.push([_start_x, _start_y + i * 100]);
        _points.push([_start_x + _realvalue, _start_y + i * 100]);
        _points.push([_start_x + _realvalue + 5, _start_y + i * 100 + 25]);
        _points.push([_start_x + 5, _start_y + i * 100 + 25]);
        let returnstr = _points.join(" L");
        return "M" + returnstr + " Z";
    }

    export function getLinePath(d: any, i: number, _XScale: any, startpoint: any) {
        let _realvalue = _XScale(<number>d.value);
        let _points = [];
        let _start_x = startpoint.x;
        let _start_y = startpoint.y;
        _points.push([_start_x, _start_y + i * 100]);
        _points.push([_start_x + 20, _start_y + i * 100 + 80]);
        let returnstr = _points.join(" L");
        return "M" + returnstr;
    }
}