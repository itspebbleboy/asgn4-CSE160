class Light{
    constructor(index){
        this.enabled = true;
        this.index = index; //index in the list of lights
        this.position = [1.0, 1.0, 1.0, 1.0]; // Default to a point light
        this.color = [1.0, 1.0, 1.0]; // White light
        this.ambient_intensity = .1;
        this.diffuse_intensity = .7;
        this.direction = [0.0, 0.0, 0.0]; // spotlight direction, is 0 if not spotlight
        this.cutoff = 0; // Spotlight cutoff angle (30 degrees)

        //lu stands for Light Uniform
        this.lu_Enabled = gl.getUniformLocation(gl.program, `lights[${index}].enabled`);
        if (u_LightingOn < 0) {
          console.log('Failed to get the storage location of `lights[${index}].enabled`');
          return false;
        }
        this.lu_Position = gl.getUniformLocation(gl.program, `lights[${index}].position`);
        if (u_LightingOn < 0) {
          console.log('Failed to get the storage location of lights[${index}].position');
          return false;
        }
        this.lu_Color = gl.getUniformLocation(gl.program, `lights[${index}].color`);
        if (u_LightingOn < 0) {
          console.log('Failed to get the storage location of lights[${index}].color');
          return false;
        }
        this.lu_Direction = gl.getUniformLocation(gl.program, `lights[${index}].direction`);
        if (u_LightingOn < 0) {
          console.log('Failed to get the storage location of lights[${index}].direction');
          return false;
        }
        this.lu_Cutoff = gl.getUniformLocation(gl.program, `lights[${index}].cutoff`);
        if (u_LightingOn < 0) {
          console.log('Failed to get the storage location of lights[${index}].cutoff');
          return false;
        }
    }

    render(){
        gl.uniform1i(this.lu_Enabled, this.enabled);
        gl.uniform4f(this.lu_Position, this.position[0], this.position[1], this.position[2], this.position[3]);
        gl.uniform3f(this.lu_Color, this.color[0],this.color[1],this.color[2]);
        gl.uniform3f(this.lu_Direction, this.direction[0], this.direction[1], this.direction[2]);
        gl.uniform1f(this.lu_Cutoff, this.cutoff);
    }
}