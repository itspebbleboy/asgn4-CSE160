// vertex shader source codes
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  attribute vec4 a_Color;
  attribute vec3 a_Normal;
  varying vec2 v_UV;
  varying vec4 v_Color;
  varying vec3 v_Normal;
  varying vec4 v_VertPos;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
    v_Color = a_Color;
    v_Normal = a_Normal;
    v_VertPos = u_ModelMatrix * a_Position;
  }`;

// fragment shader source code
var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  varying vec4 v_Color;
  varying vec3 v_Normal;
  varying vec4 v_VertPos;
  uniform vec4 u_FragColor;
  uniform vec3 u_CameraPosition;
  uniform int u_LightingOn;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform int u_WhichTexture;
  uniform vec3 u_LightPos;

  void main() {
    gl_FragColor = u_FragColor;
    if (u_WhichTexture == -3){
      gl_FragColor = vec4((v_Normal +1.0)/2.0, 1.0);
    }
    else if (u_WhichTexture == -2) {
      gl_FragColor = u_FragColor;
    }
    else if (u_WhichTexture == -1) {
      gl_FragColor = vec4(v_UV,1.0,1.0);
    }
    else if (u_WhichTexture == 0) {
      gl_FragColor = texture2D(u_Sampler0, v_UV);
    } 
    else if (u_WhichTexture == 1) {
      gl_FragColor = texture2D(u_Sampler1, v_UV);
    } else{
      gl_FragColor = vec4(1,0,0,1); //error, redish
    }
    if(u_LightingOn == 1) return;
    vec3 lightVector =  u_LightPos - vec3(v_VertPos);
    float r = length(lightVector);

    vec3 L = normalize(lightVector);
    vec3 N = normalize(v_Normal);
    float nDotL = max(dot(N,L), 0.0);

    vec3 R = reflect(-L,N);
    vec3 E = normalize(u_CameraPosition - vec3(v_VertPos));
    
    float specular = pow(max(dot(E,R),0.0),5.0);

    vec3 diffuse = vec3 (gl_FragColor) * nDotL * .7;
    vec3 ambient = vec3 (gl_FragColor) * 0.3;
    gl_FragColor = vec4(specular + diffuse + ambient, 1.0);
  }`;

// global vars for WebGL context & shader program attributes/uniforms
let gl;
let canvas;
  //attribute
let a_Position;
let a_UV;
let a_Color;
let a_Normal;
  //uniform
let u_FragColor;
let u_LightPos;
let u_Size;
let u_ModelMatrix;
let u_ProjectionMatrix;
let u_ViewMatrix;
let u_GlobalRotateMatrix;
let u_Samplers = [];
let u_CameraPosition = [0,0,0];
let u_LightingOn;

let num_texts = 2;
let gl_TEXTURES;
let textures = ["./resources/grass4.png", './resources/floor.jpg'];
let u_WhichTexture = 0;

let g_rotateMatrix;
let g_angle = 0;
let g_time = Date.now(); // Initialize g_time outside the tick function for persistence

let g_lightPos = [0,19,0]; 
let lightingOn = false;
let normalsOn = false;

let camera_rotateY = 0;
let camera_rotateX = 0;
let key_state=0;
let mouseymove = false;
// Camera
var camera = new Camera();

/* 
REQUIREMENTS FOR ASGN 4
- Have at least one cube          1
- Created a sphere                1
- Lighting (amb+diff+spec) works  2.5   or    1.5 lighting correct, no color added
  and the lighting color changes 
  correctly with slider           
- A visual marker of light        0.5
  location exists.                
- A user interface button to turn 1
  on & off lighting               
- The point light moves around    1
  the world over time & also 
  using the slider                
- Your world exists & is lighted  0.75              
- a spot light is added           0.75
- button to visualize             1
  normals w/ color
- github link                     0.5
*/
let sphere, cube, sky, floor;
let objs = [sphere, cube];

function main() {
  if (!setupWebGL()) {
      return;
  }
  if (!connectVariablesToGLSL()) {
      return;
  }
  eventsAndHTMLUI(document, canvas);

  initTextures();
  gl.clearColor(75/255, 97/255, 84/255, 1.0);
  initGeometry();

  function renderScene() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    // making the projection  matrix 
    var projMat = new Matrix4();
    projMat.setPerspective(camera.fov, canvas.width/canvas.height, .1, 1000);
    gl.uniformMatrix4fv(u_ProjectionMatrix,false,projMat.elements);

    // making the view matrix 
    var viewMat = new Matrix4();
    viewMat.setLookAt(camera.eye.elements[0],camera.eye.elements[1], camera.eye.elements[2], 
        camera.at.elements[0], camera.at.elements[1], camera.at.elements[2], 
            camera.up.elements[0],camera.up.elements[1],camera.up.elements[2]);
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);
    
    const l = lightingOn? 0 : 1
    gl.uniform1i(u_LightingOn, l);
    // rotate matrix
    g_rotateMatrix = new Matrix4();
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, g_rotateMatrix.elements);
    gl.uniform3f(u_LightPos, g_lightPos[0],g_lightPos[1],g_lightPos[2]);
    gl.uniform3f(u_CameraPosition, camera.eye.elements[0],camera.eye.elements[1], camera.eye.elements[2]);

    if(normalsOn){
      objs.forEach(obj => {
        obj.textureNum = -3;
        obj.render();
      });
    }else{
      objs.forEach(obj => {
        obj.textureNum = -2;
        obj.render();
      });
    }
    sky.render();
    floor.render();

    let light = new Cube();
    light.color = [0,1,0,1];
    light.textureNum = -2;
    light.matrix.translate(g_lightPos[0], g_lightPos[1], g_lightPos[2]);
    light.matrix.scale(-.5,-.5,-.5);
    light.matrix.translate(-.5,-.5,.5);
    light.render();
  }

  var tick = function(){
    let startTime = performance.now();

    var now = Date.now();
    var elapsed = now - g_time;// in milliseconds
    g_time = now;
      
    // init render call
    camera.rot[0] = camera_rotateX;
    camera.rot[1] = camera_rotateY;
    camera.update(elapsed);
    camera_rotateX = 0;
    camera_rotateY = 0;

    renderScene();
    requestAnimationFrame(tick);// req that the browser calls tick
    let duration = performance.now() - startTime;
    sendTextToHTML(" ms: " + Math.floor(duration) + " fps: " + Math.floor(10000/duration), "fps");
  };
  
  requestAnimationFrame(tick);
}

function initGeometry(){
  sphere = new Sphere();
  sphere.textureNum = -2;
  sphere.color = [1,0,0,1];
  sphere.matrix.translate(0,5,0);
  sphere.matrix.scale(1,1,1);
  objs[0] = sphere;
  cube = new Cube();
  cube.color = [200/255,100/255,100/255,1];
  cube.matrix.translate(0,0,0);
  cube.textureNum = -2;
  objs[1] = cube;

  sky = new Cube();
  sky.color = [180/255,220/255,230/255,1];
  sky.textureNum = -2;
  sky.matrix.scale(-20,-20,-20);
  sky.matrix.translate(-.5,-.99,.5);

  floor = new Cube();
  floor.color = [80/255,100/255,80/255,1];
  floor.textureNum = 0; 
  floor.matrix.translate(-10,-1,10);
  floor.matrix.scale(20,1,20);
}

//#region    // CANVAS & DOCUMENT SHIZ //
function eventsAndHTMLUI(document, canvas){
  document.onkeydown = keydown;
  document.onkeyup = keyup;

  document.getElementById('lightingCheckbox').addEventListener('change', (ev) =>{
    lightingOn = document.getElementById('lightingCheckbox').checked;
  });
  document.getElementById('normalCheckbox').addEventListener('change', (ev) =>{
    normalsOn = document.getElementById('normalCheckbox').checked;
    console.log("normals on");
  });

  document.getElementById('lightXSlider0').addEventListener('input', function() {
    g_lightPos[0] = parseFloat(this.value);
  });
  document.getElementById('lightYSlider0').addEventListener('input', function() {
    g_lightPos[1] = parseFloat(this.value);
  });
  document.getElementById('lightZSlider0').addEventListener('input', function() {
    g_lightPos[2] = parseFloat(this.value);
  });
  canvas.addEventListener("click", async (ev) => {
    if (!mouseymove){
      await canvas.requestPointerLock({
        unadjustedMovement: true,
      });
    }
  });

  document.addEventListener("pointerlockchange", (ev) => {
    mouseymove = !mouseymove;
  });

  document.addEventListener("mousemove", (ev) => {
    if(!mouseymove) return;  
    camera_rotateY += ev.movementX; // controls yaw
    camera_rotateX -= ev.movementY; // controls pitch  
  });  
  function keydown(ev){
    switch(ev.keyCode){ //PRESS DOWN
      case 68: //D 
        camera.move[0] = 1;
        break;
      case 65: //A
        camera.move[0] = -1;
        break;
      case 87: //W
        camera.move[2] = 1;
        break;
      case 83: //S
        camera.move[2] = -1;
        break;
      case 81: //Q
        camera_rotateY = -10;
        break;
      case 69: //E
        camera_rotateY =10;
        break;
      default:
        console.log("invalid key");
        break; 
    }
  }
  function keyup(ev){
    switch(ev.keyCode){ // RELEASE
      case 68: //D
        camera.move[0] = 0;
        break;
      case 65: //A
        camera.move[0] = 0;
        break;
      case 87: //W
        camera.move[2] = 0;
        break;
      case 83: //S
        camera.move[2] = 0;
        break;
      default:
        break; 
    }
  }
}
//#endregion    // CANVAS & DOCUMENT SHIZ //

function clearCanvas() {
    renderScene(); // Re-render the canvas, which should now be clear
}

function loadTexture(image, num) {
  let texture = gl.createTexture();
  if (!texture) {
    console.error("Failed to create texture");
    return -1;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);   // flip the image's y axis
  gl.activeTexture(gl_TEXTURES[num]);  // enable the texture unit 0
  gl.bindTexture(gl.TEXTURE_2D, texture); // bind texture obj to the target 
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); // set the texture parameters 
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image); // set the texture image
  gl.uniform1i(u_Samplers[num], num); // set the texture unit 0 to the sampler
}

function initTextures() {
  for (let i = 0; i < textures.length; i++) {
    let img = new Image();
    img.src = textures[i];
    img.onload = function() { loadTexture(img, i); }
  }
}


function setupWebGL() {
  // Retrieve <canvas> element & get the rendering context for WebGL
  canvas = document.getElementById('webgl');

  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true }); // for performance
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return false;
  }
  gl_TEXTURES = [gl.TEXTURE0, gl.TEXTURE1];
  return true;
}


function connectVariablesToGLSL() {
  // init shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders.');
    return false;
  }

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return false;
  }
  u_LightingOn = gl.getUniformLocation(gl.program, 'u_LightingOn');
  if (u_LightingOn < 0) {
    console.log('Failed to get the storage location of u_LightingOn');
    return false;
  }
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return false;
  }
  u_LightPos = gl.getUniformLocation(gl.program, 'u_LightPos');
  if (!u_LightPos) {
    console.log('Failed to get the storage location of u_LightPos');
    return false;
  }
  u_CameraPosition = gl.getUniformLocation(gl.program, 'u_CameraPosition');
  if (!u_CameraPosition) {
    console.log('Failed to get the storage location of u_CameraPosition');
    return false;
  }
  a_UV = gl.getAttribLocation(gl.program, "a_UV");
  if (a_UV < 0) {
    console.log('Failed to get the storage location of a_UV');
    return;
  }
  a_Normal = gl.getAttribLocation(gl.program, "a_Normal");
  if (!a_Normal) { 
    console.log('Failed to get the storage location of a_Normal');
    return false;
  }
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) { 
    console.log('Failed to get the storage location of u_ModelMatrix');
    return false;
  }
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_GlobalRotateMatrix) { 
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return false;
  }
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, "u_ProjectionMatrix");
  if (!u_ProjectionMatrix) {
    console.log('Failed to get the storage location of u_ProjectionMatrix');
    return;
  }
  u_ViewMatrix = gl.getUniformLocation(gl.program, "u_ViewMatrix");
  if (!u_ProjectionMatrix) {
    console.log('Failed to get the storage location of u_ViewMatrix');
    return;
  }
  for (let i = 0; i < num_texts; i++) {
    let u_Sampler = gl.getUniformLocation(gl.program, `u_Sampler${i}`);
    if (!u_Sampler) {
      console.error(`Failed to get the storage location of u_Sampler${i}`);
      return -1;
    }
    u_Samplers.push(u_Sampler);
  }
  u_WhichTexture = gl.getUniformLocation(gl.program, "u_WhichTexture");
  if (!u_WhichTexture) {
    console.error('Failed to get the storage location of u_WhichTexture');
    return -1;
  }
  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);

  // set the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  return true;
}

function sendTextToHTML(text,htmlID){
    var htmlElm = document.getElementById(htmlID);
    if(!htmlElm){
        console.log('Failed to get ' + htmlID + ' from HTML');
        return;
    }
    htmlElm.innerHTML = text;
}

main();