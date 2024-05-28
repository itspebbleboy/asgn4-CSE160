class Light{
    constructor(index){
        this.enabled = true;
        this.index = index; //index in the list of lights
        this.position = [0.0, 10.0, 0.0];
        this.color = [1.0, 1.0, 1.0]; // White light
        this.ambient_intensity = .3;
        this.diffuse_intensity = .7;
        this.direction = [0.0, 0.0, 0.0]; // spotlight direction, is 0 if not spotlight
        this.cutoff = 0; // Spotlight cutoff angle (30 degrees)
        this.lu_Enabled;
        this.lu_Enabled = gl.getUniformLocation(gl.program, `lights[${index}].enabled`);
        if (this.lu_Enabled < 0) {
          console.log('Failed to get the storage location of `lights[${index}].enabled`');
          return false;
        }
        this.lu_Position = gl.getUniformLocation(gl.program, `lights[${index}].position`);
        if (this.lu_Position < 0) {
          console.log('Failed to get the storage location of lights[${index}].position');
          return false;
        }
        this.lu_Color = gl.getUniformLocation(gl.program, `lights[${index}].color`);
        if (this.lu_Color < 0) {
          console.log('Failed to get the storage location of lights[${index}].color');
          return false;
        }
        this.lu_AmbientIntensity = gl.getUniformLocation(gl.program, `lights[${index}].amb_intensity`);
        if (this.lu_AmbientIntensity < 0) {
          console.log('Failed to get the storage location of lights[${index}].amb_intensity');
          return false;
        }
        this.lu_DiffuseIntensity = gl.getUniformLocation(gl.program, `lights[${index}].diff_intensity`);
        if (this.lu_DiffuseIntensity < 0) {
          console.log('Failed to get the storage location of lights[${index}].diff_intensity');
          return false;
        }
        this.lu_Direction = gl.getUniformLocation(gl.program, `lights[${index}].direction`);
        if (this.lu_Direction < 0) {
          console.log('Failed to get the storage location of lights[${index}].direction');
          return false;
        }
        this.lu_Cutoff = gl.getUniformLocation(gl.program, `lights[${index}].cutoff`);
        if (this.lu_Cutoff < 0) {
          console.log('Failed to get the storage location of lights[${index}].cutoff');
          return false;
        }
    }

    render(){
        gl.uniform1i(this.lu_Enabled, this.enabled);
        gl.uniform3f(this.lu_Position, this.position[0], this.position[1], this.position[2]);
        gl.uniform3f(this.lu_Color, this.color[0],this.color[1],this.color[2]);
        gl.uniform3f(this.lu_Direction, this.direction[0], this.direction[1], this.direction[2]);
        gl.uniform1f(this.lu_Cutoff, this.cutoff);
        gl.uniform1f(this.lu_AmbientIntensity, this.ambient_intensity);
        gl.uniform1f(this.lu_DiffuseIntensity, this.diffuse_intensity);
    }
}