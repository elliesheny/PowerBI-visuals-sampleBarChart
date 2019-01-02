module powerbi.extensibility.visual {
    // powerbi.visuals
    import ISelectionId = powerbi.visuals.ISelectionId;

    /**
     * Interface for BarCharts viewmodel.
     *
     * @interface
     * @property {BarChartDataPoint[]} dataPoints - Set of data points the visual will render.
     * @property {number} dataMax                 - Maximum data value in the set of data points.
     */
    interface BarChartViewModel {
        dataPoints: BarChartDataPoint[];
        dataMax: number;
        settings: BarChartSettings;
    };

    /**
     * Interface for BarChart data points.
     *
     * @interface
     * @property {number} value             - Data value for point.
     * @property {string} category          - Corresponding category of data value.
     * @property {string} color             - Color corresponding to data point.
     * @property {ISelectionId} selectionId - Id assigned to data point for cross filtering
     *                                        and visual interaction.
     */
    interface BarChartDataPoint {
        value: PrimitiveValue;
        category: string;
        color: string;
        strokeColor: string;
        strokeWidth: number;
        valuedisplay: any;
        selectionId: ISelectionId;
    };

    /**
     * Interface for BarChart settings.
     *
     * @interface
     * @property {{show:boolean}} enableAxis - Object property that allows axis to be enabled.
     * @property {{generalView.opacity:number}} Bars Opacity - Controls opacity of plotted bars, values range between 10 (almost transparent) to 100 (fully opaque, default)
     * @property {{generalView.showHelpLink:boolean}} Show Help Button - When TRUE, the plot displays a button which launch a link to documentation.
     */
    interface BarChartSettings {
        enableAxis: {
            show: boolean;
            fill: string;
        };
        generalView: {
            opacity: number;  
            barColor: Fill; 
            fontColor: Fill; 
            fontSkewangle: number;
            fontSize: number;
            fontFamily: string;
        };
        dataControl: {
            showDataCount: number;
            showFromLeftSide: boolean;
            dataForwardTop: boolean; 
            dataBarLongToShort: boolean; 
        };
    }

    /**
     * Function that converts queried data into a view model that will be used by the visual.
     *
     * @function
     * @param {VisualUpdateOptions} options - Contains references to the size of the container
     *                                        and the dataView which contains all the data
     *                                        the visual had queried.
     * @param {IVisualHost} host            - Contains references to the host which contains services
     */
    function visualTransform(options: VisualUpdateOptions, host: IVisualHost): BarChartViewModel {
        let dataViews = options.dataViews;
        let defaultSettings: BarChartSettings = {
            enableAxis: {
                show: false,
                fill: "#000000",
            },
            generalView: {
                opacity: 80,    
                barColor: { solid: { color: "#18477F" } },//53544F
                fontColor: { solid: { color: "#18477F" } },
                fontSkewangle: 13,
                fontSize: 21,
                fontFamily: 'wf_standard-font,helvetica,arial,sans-serif'
            },
            dataControl: { 
                showDataCount: 5,
                showFromLeftSide: true,
                dataForwardTop: true, 
                dataBarLongToShort: true,
            }
        };
        let viewModel: BarChartViewModel = {
            dataPoints: [],
            dataMax: 0,
            settings: <BarChartSettings>{}
        };

        if (!dataViews
            || !dataViews[0]
            || !dataViews[0].categorical
            || !dataViews[0].categorical.categories
            || !dataViews[0].categorical.categories[0].source
            || !dataViews[0].categorical.values
        ) {
            return viewModel;
        }

        let categorical = dataViews[0].categorical;
        let category = categorical.categories[0];
        let datavaluedisplay = categorical.categories.length > 1 ? categorical.categories[1]:categorical.values[0];
        let dataValue = categorical.values[0];

        let barChartDataPoints: BarChartDataPoint[] = [];
        let dataMax: number;

        let colorPalette: ISandboxExtendedColorPalette = host.colorPalette;
        let objects = dataViews[0].metadata.objects;

        const strokeColor: string = getColumnStrokeColor(colorPalette);

        let barChartSettings: BarChartSettings = {
            enableAxis: {
                show: getValue<boolean>(objects, 'enableAxis', 'show', defaultSettings.enableAxis.show),
                fill: getAxisTextFillColor(objects, colorPalette, defaultSettings.enableAxis.fill),
            },
            generalView: {
                opacity: getValue<number>(objects, 'generalView', 'opacity', defaultSettings.generalView.opacity),  
                barColor: getValue<Fill>(objects, 'generalView', 'barColor', defaultSettings.generalView.barColor), 
                fontColor: getValue<Fill>(objects, 'generalView', 'fontColor', defaultSettings.generalView.fontColor), 
                fontSkewangle: getValue<number>(objects, 'generalView', 'fontSkewangle', defaultSettings.generalView.fontSkewangle),
                fontSize: getValue<number>(objects, 'generalView', 'fontSize', defaultSettings.generalView.fontSize),
                fontFamily: getValue<string>(objects, 'generalView', 'fontFamily', defaultSettings.generalView.fontFamily),
            },
            dataControl: { 
                showDataCount: getValue<number>(objects, 'dataControl', 'showDataCount', defaultSettings.dataControl.showDataCount),
                showFromLeftSide: getValue<boolean>(objects, 'dataControl', 'showFromLeftSide', defaultSettings.dataControl.showFromLeftSide),
                dataForwardTop: getValue<boolean>(objects, 'dataControl', 'dataForwardTop', defaultSettings.dataControl.dataForwardTop),
                dataBarLongToShort: getValue<boolean>(objects, 'dataControl', 'dataBarLongToShort', defaultSettings.dataControl.dataBarLongToShort),
            },
        };

        const strokeWidth: number = getColumnStrokeWidth(colorPalette.isHighContrast);
        //debugger
        for (let i = 0, len = Math.max(category.values.length, dataValue.values.length); i < len; i++) {
            const color: string = getColumnColorByIndex(category, i, colorPalette);

            const selectionId: ISelectionId = host.createSelectionIdBuilder()
                .withCategory(category, i)
                .createSelectionId();

            barChartDataPoints.push({
                color,
                strokeColor,
                strokeWidth,
                selectionId,
                value: dataValue.values[i],
                valuedisplay: datavaluedisplay.values[i],
                category: `${category.values[i]}`,
            });
        }

        dataMax = <number>dataValue.maxLocal;

        return {
            dataPoints: barChartDataPoints,
            dataMax: dataMax,
            settings: barChartSettings,
        };
    }

    function getColumnColorByIndex(
        category: DataViewCategoryColumn,
        index: number,
        colorPalette: ISandboxExtendedColorPalette,
    ): string {
        if (colorPalette.isHighContrast) {
            return colorPalette.background.value;
        }

        const defaultColor: Fill = {
            solid: {
                color: colorPalette.getColor(`${category.values[index]}`).value,
            }
        };

        return getCategoricalObjectValue<Fill>(
            category,
            index,
            'colorSelector',
            'fill',
            defaultColor
        ).solid.color;
    }

    function getColumnStrokeColor(colorPalette: ISandboxExtendedColorPalette): string {
        return colorPalette.isHighContrast
            ? colorPalette.foreground.value
            : null;
    }

    function getColumnStrokeWidth(isHighContrast: boolean): number {
        return isHighContrast
            ? 2
            : 0;
    }

    function getAxisTextFillColor(
        objects: DataViewObjects,
        colorPalette: ISandboxExtendedColorPalette,
        defaultColor: string
    ): string {
        if (colorPalette.isHighContrast) {
            return colorPalette.foreground.value;
        }

        return getValue<Fill>(
            objects,
            "enableAxis",
            "fill",
            {
                solid: {
                    color: defaultColor,
                }
            },
        ).solid.color;
    }

    export class BarChart implements IVisual {
        private svg: d3.Selection<SVGElement>;
        private host: IVisualHost;
        private selectionManager: ISelectionManager;
        private barContainer: d3.Selection<SVGElement>;
        private xAxis: d3.Selection<SVGElement>;
        private barDataPoints: BarChartDataPoint[];
        private barChartSettings: BarChartSettings;
        private tooltipServiceWrapper: ITooltipServiceWrapper;
        private locale: string;
        //private helpLinkElement: d3.Selection<any>;

        private barSelection: d3.selection.Update<BarChartDataPoint>;

        static Config = {
            xScalePadding: 0.1,
            solidOpacity: 1,
            transparentOpacity: 0.4,
            margins: {
                top: 0,
                right: 0,
                bottom: 25,
                left: 30,
            },
            xAxisFontMultiplier: 0.04,
        };

        /**
         * Creates instance of BarChart. This method is only called once.
         *
         * @constructor
         * @param {VisualConstructorOptions} options - Contains references to the element that will
         *                                             contain the visual and a reference to the host
         *                                             which contains services.
         */
        constructor(options: VisualConstructorOptions) {
            this.host = options.host;
            this.selectionManager = options.host.createSelectionManager();

            this.selectionManager.registerOnSelectCallback(() => {
                this.syncSelectionState(this.barSelection, this.selectionManager.getSelectionIds() as ISelectionId[]);
            });

            this.tooltipServiceWrapper = createTooltipServiceWrapper(this.host.tooltipService, options.element);

            this.svg = d3.select(options.element)
                .append('svg')
                .classed('barChart', true);

            this.locale = options.host.locale;

            this.barContainer = this.svg
                .append('g')
                .classed('barContainer', true);

            this.xAxis = this.svg
                .append('g')
                .classed('xAxis', true);

            ////const helpLinkElement: Element = this.createHelpLinkElement();
            ////options.element.appendChild(helpLinkElement);

            ////this.helpLinkElement = d3.select(helpLinkElement);
        }

        /**
         * Updates the state of the visual. Every sequential databinding and resize will call update.
         *
         * @function
         * @param {VisualUpdateOptions} options - Contains references to the size of the container
         *                                        and the dataView which contains all the data
         *                                        the visual had queried.
         */
        public update(options: VisualUpdateOptions) {

            //options.dataViews[0].categorical.categories[0].values
            //options.dataViews[0].categorical.values[0].values
            //options.dataViews[0].categorical.values[0].highlights

            this.barContainer.selectAll('._bar').remove();
            this.barContainer.selectAll('._bar_line').remove();
            this.barContainer.selectAll('._bar_name').remove();
            this.barContainer.selectAll('._bar_value').remove();


            let viewModel: BarChartViewModel = visualTransform(options, this.host);
            let settings = this.barChartSettings = viewModel.settings;
            //this.barDataPoints = viewModel.dataPoints;


            this.barDataPoints = getArrayValues(viewModel.dataPoints, settings.dataControl.showDataCount, settings.dataControl.dataForwardTop);

            

            let width = options.viewport.width;
            let height = options.viewport.height;


            let startpoint = getStartPoint(settings.dataControl.showFromLeftSide, width, height);


            this.svg.attr({ width: width, height: height });

            let _maxvalue = settings.dataControl.dataForwardTop ? <number>this.barDataPoints[0].value : <number>this.barDataPoints[this.barDataPoints.length - 1].value;
            let _minvalue = settings.dataControl.dataForwardTop ? <number>this.barDataPoints[this.barDataPoints.length - 1].value : <number>this.barDataPoints[0].value ;
            let _XScale = null;//d3.scale.linear().domain([0, _maxvalue - (_maxvalue - _minvalue) * 1.5, _maxvalue]).range([0, 0, width - 15]);

            if ((settings.dataControl.dataForwardTop && settings.dataControl.dataBarLongToShort)
                || (!settings.dataControl.dataForwardTop && !settings.dataControl.dataBarLongToShort)){
                _XScale = d3.scale.linear().domain([0, _minvalue, _maxvalue]).range([0, (width - 15) / 3, width - 15]);
            } else if ((settings.dataControl.dataForwardTop && !settings.dataControl.dataBarLongToShort)
                || (!settings.dataControl.dataForwardTop && settings.dataControl.dataBarLongToShort)){
                _XScale = d3.scale.linear().domain([0, _minvalue, _maxvalue]).range([0, width - 15, (width - 15) / 3]);
            } 

            let _barSelection = this.barContainer.selectAll('._bar').data(this.barDataPoints);
            let _barSelection_line = this.barContainer.selectAll('._bar_line').data(this.barDataPoints);
            let _barSelection_name = this.barContainer.selectAll('._bar_name').data(this.barDataPoints);
            let _barSelection_value = this.barContainer.selectAll('._bar_value').data(this.barDataPoints);
            _barSelection.enter().append('path');
            _barSelection_line.enter().append('path');
            _barSelection_name.enter().append('text');
            _barSelection_value.enter().append('text');
            _barSelection.attr("d", function (d, i) { 
                return getAreaPath(d, i, _XScale, startpoint, settings.dataControl.showFromLeftSide); 
                })
                .attr('fill-opacity', (settings.generalView.opacity/100.0))
                .attr('stroke-opacity', (settings.generalView.opacity / 100.0))
                .attr("stroke", "none")
                .attr("stroke-width", 1)
                .attr("fill", settings.generalView.barColor.solid.color)//"#18477F"
                .classed('_bar', true);
            _barSelection_line
                .attr("d", function (d, i) {
                    return getLinePath(d, i, _XScale, startpoint, settings.dataControl.showFromLeftSide);  
                })
                .attr('fill-opacity', (settings.generalView.opacity / 200.0))
                .attr('stroke-opacity', (settings.generalView.opacity / 200.0))
                .attr("stroke", "#A1BEFF")
                .attr("stroke-width", 1)
                .attr("fill", "none")
                .classed('_bar_line', true);


            _barSelection_name
                .attr('x', function (d, i) {
                    return getNamePoint(d, i, _XScale, startpoint, settings).x;
                })
                .attr('y', function (d, i) {
                    return getNamePoint(d, i, _XScale, startpoint, settings).y;
                })
                .style({
                    'font-size': settings.generalView.fontSize + 'px',
                    'font-family': settings.generalView.fontFamily,
                    'fill': settings.generalView.fontColor.solid.color,
                    'text-anchor': settings.dataControl.showFromLeftSide ? 'start' : 'end',
                    'pointer-events': 'none',
                    'transform': settings.dataControl.showFromLeftSide ? 'skewX(' + settings.generalView.fontSkewangle + 'deg)' : 'skewX(-' + settings.generalView.fontSkewangle+'deg)'
                })
                .text(function (d, i) {
                    return d.category.toString();
                })
                .classed('_bar_name', true);;
            _barSelection_value
                .attr('x', function (d, i) {
                    return getValuePoint(d, i, _XScale, startpoint, settings).x;
                })
                .attr('y', function (d, i) {
                    return getValuePoint(d, i, _XScale, startpoint, settings).y;
                })
                .style({
                    'font-size': settings.generalView.fontSize + 'px',
                    'font-family': settings.generalView.fontFamily,
                    'fill': settings.generalView.fontColor.solid.color,
                    'text-anchor': settings.dataControl.showFromLeftSide ?'start':'end',
                    'pointer-events': 'none',
                    'transform': settings.dataControl.showFromLeftSide ? 'skewX(' + settings.generalView.fontSkewangle + 'deg)' : 'skewX(-' + settings.generalView.fontSkewangle+'deg)'
                })
                .text(function (d, i) {
                    return d.valuedisplay.toString();
                })
                .classed('_bar_value', true);;


            this.tooltipServiceWrapper.addTooltip(this.barContainer.selectAll('._bar'),
                (tooltipEvent: TooltipEventArgs<BarChartDataPoint>) => this.getTooltipData(tooltipEvent.data),
                (tooltipEvent: TooltipEventArgs<BarChartDataPoint>) => tooltipEvent.data.selectionId
            );



            this.syncSelectionState(
                _barSelection,
                this.selectionManager.getSelectionIds() as ISelectionId[]
            );

            _barSelection.on('click', (d) => {
                // Allow selection only if the visual is rendered in a view that supports interactivity (e.g. Report)
                if (this.host.allowInteractions) {
                    const isCtrlPressed: boolean = (d3.event as MouseEvent).ctrlKey;

                    this.selectionManager
                        .select(d.selectionId, isCtrlPressed)
                        .then((ids: ISelectionId[]) => {
                            this.syncSelectionState(_barSelection, ids);
                        });

                    (<Event>d3.event).stopPropagation();
                }
            });

            _barSelection.exit().remove();

            ////// Clear selection when clicking outside a bar
            this.svg.on('click', (d) => {
                if (this.host.allowInteractions) {
                    this.selectionManager
                        .clear()
                        .then(() => {
                            this.syncSelectionState(_barSelection, []);
                        });
                }
            });



            //if (settings.enableAxis.show) {
            //    let margins = BarChart.Config.margins;
            //    height -= margins.bottom;
            //}

            //this.helpLinkElement
            //    .classed("hidden", !settings.generalView.showHelpLink)
            //    .style({
            //        "border-color": settings.generalView.helpLinkColor,
            //        "color": settings.generalView.helpLinkColor,
            //    });

            //this.xAxis.style({
            //    "font-size": d3.min([height, width]) * BarChart.Config.xAxisFontMultiplier,
            //    "fill": settings.enableAxis.fill,
            //});

            //let yScale = d3.scale.linear()
            //    .domain([0, viewModel.dataMax])
            //    .range([height, 0]);

            //let xScale = d3.scale.ordinal()
            //    .domain(viewModel.dataPoints.map(d => d.category))
            //    .rangeRoundBands([0, width], BarChart.Config.xScalePadding, 0.2);

            //let xAxis = d3.svg.axis()
            //    .scale(xScale)
            //    .orient('bottom');

            //this.xAxis.attr('transform', 'translate(0, ' + height + ')')
            //    .call(xAxis);
            
            //this.barSelection = this.barContainer.selectAll('.bar')
            //    .data(this.barDataPoints);

            //this.barSelection
            //    .enter()
            //    .append('rect')
            //    .classed('bar', true);

            //const opacity: number = viewModel.settings.generalView.opacity / 100;

            //this.barSelection
            //    .attr({
            //        width: xScale.rangeBand(),
            //        height:1,// d => height - yScale(<number>d.value),
            //        y: d => yScale(<number>d.value),
            //        x: d => xScale(d.category),
            //    })
            //    .style({
            //        'fill-opacity': opacity,
            //        'stroke-opacity': opacity,
            //        fill: (dataPoint: BarChartDataPoint) => dataPoint.color,
            //        stroke: (dataPoint: BarChartDataPoint) => dataPoint.strokeColor,
            //        "stroke-width": (dataPoint: BarChartDataPoint) => `${dataPoint.strokeWidth}px`,
            //    });

            //this.tooltipServiceWrapper.addTooltip(this.barContainer.selectAll('.bar'),
            //    (tooltipEvent: TooltipEventArgs<BarChartDataPoint>) => this.getTooltipData(tooltipEvent.data),
            //    (tooltipEvent: TooltipEventArgs<BarChartDataPoint>) => tooltipEvent.data.selectionId
            //);

            ////this.syncSelectionState(
            ////    this.barSelection,
            ////    this.selectionManager.getSelectionIds() as ISelectionId[]
            ////);

            ////this.barSelection.on('click', (d) => {
            ////    // Allow selection only if the visual is rendered in a view that supports interactivity (e.g. Report)
            ////    if (this.host.allowInteractions) {
            ////        const isCtrlPressed: boolean = (d3.event as MouseEvent).ctrlKey;

            ////        this.selectionManager
            ////            .select(d.selectionId, isCtrlPressed)
            ////            .then((ids: ISelectionId[]) => {
            ////                this.syncSelectionState(this.barSelection, ids);
            ////            });

            ////        (<Event>d3.event).stopPropagation();
            ////    }
            ////});

            ////this.barSelection
            ////    .exit()
            ////    .remove();

            ////// Clear selection when clicking outside a bar
            ////this.svg.on('click', (d) => {
            ////    if (this.host.allowInteractions) {
            ////        this.selectionManager
            ////            .clear()
            ////            .then(() => {
            ////                this.syncSelectionState(this.barSelection, []);
            ////            });
            ////    }
            ////});
        }

        private syncSelectionState(
            selection: d3.Selection<BarChartDataPoint>,
            selectionIds: ISelectionId[]
        ): void { 
            if (!selection || !selectionIds) {
                return;
            }
            if (!selectionIds.length) {
                selection.style({
                    "fill-opacity": null,
                    "stroke-opacity": null,
                });

                return;
            }

            const self: this = this;

            selection.each(function (barDataPoint: BarChartDataPoint) {
                const isSelected: boolean = self.isSelectionIdInArray(selectionIds, barDataPoint.selectionId);

                const opacity: number = isSelected
                    ? BarChart.Config.solidOpacity
                    : BarChart.Config.transparentOpacity;

                d3.select(this).style({
                    "fill-opacity": opacity,
                    "stroke-opacity": opacity,
                });
            });
        }

        private isSelectionIdInArray(selectionIds: ISelectionId[], selectionId: ISelectionId): boolean {
            if (!selectionIds || !selectionId) {
                return false;
            }

            return selectionIds.some((currentSelectionId: ISelectionId) => {
                return currentSelectionId.includes(selectionId);
            });
        }

        /**
         * Enumerates through the objects defined in the capabilities and adds the properties to the format pane
         *
         * @function
         * @param {EnumerateVisualObjectInstancesOptions} options - Map of defined objects
         */
        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
            let objectName = options.objectName;
            let objectEnumeration: VisualObjectInstance[] = [];

            switch (objectName) {
                case 'enableAxis':
                    objectEnumeration.push({
                        objectName: objectName,
                        properties: {
                            show: this.barChartSettings.enableAxis.show,
                            fill: this.barChartSettings.enableAxis.fill,
                        },
                        selector: null
                    });
                    break;
                case 'colorSelector':
                    for (let barDataPoint of this.barDataPoints) {
                        objectEnumeration.push({
                            objectName: objectName,
                            displayName: barDataPoint.category,
                            properties: {
                                fill: {
                                    solid: {
                                        color: barDataPoint.color
                                    }
                                }
                            },
                            selector: barDataPoint.selectionId.getSelector()
                        });
                    }
                    break;
                case 'generalView':
                    objectEnumeration.push({
                        objectName: objectName,
                        properties: {
                            opacity: this.barChartSettings.generalView.opacity, 
                            barColor: this.barChartSettings.generalView.barColor,
                            fontColor: this.barChartSettings.generalView.fontColor,
                            fontSkewangle: this.barChartSettings.generalView.fontSkewangle,
                            fontSize: this.barChartSettings.generalView.fontSize,
                            fontFamily: this.barChartSettings.generalView.fontFamily,

 
                        },
                        validValues: {
                            opacity: {
                                numberRange: {
                                    min: 10,
                                    max: 100
                                }
                            },
                            fontSize: {
                                numberRange: {
                                    min: 1,
                                    max: 45
                                }
                            },
                            fontSkewangle: {
                                numberRange: {
                                    min: 1,
                                    max: 45
                                }
                            }
                        },
                        selector: null
                    });
                    break;

                case 'dataControl':
                    objectEnumeration.push({
                    objectName: objectName,
                    properties: { 
                        showDataCount: this.barChartSettings.dataControl.showDataCount,
                        showFromLeftSide: this.barChartSettings.dataControl.showFromLeftSide,
                        dataForwardTop: this.barChartSettings.dataControl.dataForwardTop,
                        dataBarLongToShort: this.barChartSettings.dataControl.dataBarLongToShort,


                    },
                    validValues: { 
                        showDataCount: {
                            numberRange: {
                                min: 1,
                                max: 15
                            }
                        }, 
                    },
                    selector: null
                });
                    break;
            };

            return objectEnumeration;
        }

        /**
         * Destroy runs when the visual is removed. Any cleanup that the visual needs to
         * do should be done here.
         *
         * @function
         */
        public destroy(): void {
            // Perform any cleanup tasks here
        }

        private getTooltipData(value: any): VisualTooltipDataItem[] {
            let language = getLocalizedString(this.locale, "LanguageKey");
            return [{
                displayName: value.category,
                value: value.value.toString(),
                //color: value.color,
                //header: language && "displayed language " + language
            }];
        }

        private createHelpLinkElement(): Element {
            let linkElement = document.createElement("a");
            linkElement.textContent = "?";
            linkElement.setAttribute("title", "Open documentation");
            linkElement.setAttribute("class", "helpLink");
            linkElement.addEventListener("click", () => {
                this.host.launchUrl("https://github.com/Microsoft/PowerBI-visuals/blob/master/Readme.md#developing-your-first-powerbi-visual");
            });
            return linkElement;
        };
    }
}
