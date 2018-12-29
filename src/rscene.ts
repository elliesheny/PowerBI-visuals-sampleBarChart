
module powerbi.extensibility.visual {
    "use strict";
    export class _RScene {//extends Object

        //private setting: _RSetting;  
        //private root: JQuery;
        private scene: THREE.Scene;
        private renderer: THREE.WebGLRenderer;
        private camera: THREE.PerspectiveCamera;
        private animationFrameId: number;
        private orbitControls: THREE.OrbitControls;
        private mousePos: THREE.Vector2;
        private mousePosNormalized: THREE.Vector2;
        //private china: _RChina;
        //settings: _RSetting
        constructor(options: VisualConstructorOptions) {
            //super();
            //this.setting = settings;  
            this.scene = new THREE.Scene();
            this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
            options.element.appendChild(this.renderer.domElement);
            //debugger


            this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 10000);
            //this.camera = new THREE.OrthographicCamera(-150, 150, 100, -100,-200,500);
            this.renderer.setSize(200, 200);
            this.renderer.setClearColor(0xADE7FB, 1);
            this.renderer.shadowMapEnabled = true;
            //this.camera.lookAt(new THREE.Vector3(0,0,0));

            this.orbitControls = new THREE.OrbitControls(this.camera, this.renderer.domElement);


            //var ambiColor = "#0c0c0c";
            //var ambientLight = new THREE.AmbientLight(ambiColor);
            //this.scene.add(ambientLight);


            var spotLight = new THREE.SpotLight(0xffffff);
            spotLight.position.set(0, -500, 500);
            this.scene.add(spotLight);


            



            //this.china = new _RChina();
            //this.china.Init(this.setting.Data);
            //this.china.castShadow = true;
            //this.scene.add(this.china);

            this.camera.position.set(0, -(100 / 2 / Math.tan(22.5)), 5);
            this.camera.lookAt(this.scene.position);




            var planeGeometry = new THREE.PlaneGeometry(2000, 2000, 1, 1);
            var planeMaterial = new THREE.MeshLambertMaterial(
                { color: 0xADE7FB });
            var plane = new THREE.Mesh(planeGeometry, planeMaterial);
            plane.receiveShadow = true;
            plane.position.z = -0.2;
            plane.receiveShadow = true;
            this.scene.add(plane);


            var directionalLight = new THREE.DirectionalLight(0xFFFFFF);
            directionalLight.position.set(-200, -300, 80);
            directionalLight.castShadow = true;
            directionalLight.shadowCameraNear = 2;
            directionalLight.shadowCameraFar = 2000;
            directionalLight.intensity = 3;
            directionalLight.shadowMapHeight = 1024;
            directionalLight.shadowMapWidth = 1024;
            directionalLight.shadowCameraLeft = -5;
            directionalLight.shadowCameraRight = 5;
            directionalLight.shadowCameraTop = 5;
            directionalLight.shadowCameraBottom = -5;
            this.scene.add(directionalLight);


            //var pointColor = "#ffffff";
            //var spotLight = new THREE.SpotLight(pointColor);
            //spotLight.position.set(-40, -60, 20);
            //spotLight.castShadow = true;
            //spotLight.shadowCameraNear = 2;
            //spotLight.shadowCameraFar = 200;
            //spotLight.shadowCameraFov = 30;
            //spotLight.target = plane;
            //spotLight.distance = 0;
            //spotLight.angle = 0.4;
            //this.scene.add(spotLight);
             


            

            const render: FrameRequestCallback = () => {
                try {
                    this.renderer.render(this.scene, this.camera);
                } catch (e) {
                    console.error(e);
                }
                this.animationFrameId = requestAnimationFrame(render);
            };

            this.animationFrameId = requestAnimationFrame(render);


            $(this.renderer.domElement).on("mouseup", (event: JQueryEventObject) => {

                var element = this.renderer.domElement;
                const elementStyle: CSSStyleDeclaration = window.getComputedStyle(element);
                const elementViewHeight: number = element.offsetHeight - element.offsetTop
                    - parseFloat(elementStyle.paddingTop)
                    - parseFloat(elementStyle.paddingBottom);

                const elementViewWidth: number = element.offsetWidth - element.offsetLeft
                    - parseFloat(elementStyle.paddingLeft)
                    - parseFloat(elementStyle.paddingRight);
                const fractionalPositionX: number = event.offsetX / elementViewWidth;
                const fractionalPositionY: number = event.offsetY / elementViewHeight;
                this.mousePosNormalized = new THREE.Vector2(fractionalPositionX * 2 - 1, -fractionalPositionY * 2 + 1);
                this.mousePos = new THREE.Vector2(event.clientX, event.clientY);


                var rayCaster = new THREE.Raycaster();
                rayCaster.setFromCamera(this.mousePosNormalized, this.camera); 
            });


        } 
 

        public Update(options: VisualUpdateOptions): void {
            this.camera.aspect = options.viewport.width / options.viewport.height;
            this.camera.updateProjectionMatrix(); 
            this.renderer.setSize(options.viewport.width, options.viewport.height);
            this.renderer.render(this.scene, this.camera);
        }
    }
}
