class Camera {
    constructor() {
        this.fov = 60;
        this.eye = new Vector3([-10, 7, 5]);
        this.at = new Vector3([0, 0, 0]);
        this.up = new Vector3([0, 1, 0]);
        this.moveSpeed = 10;
        this.rotateSpeed = 10; // Adjusted for sensitivity
        this.move = new Float32Array([0, 0, 0]); //x, y, z 
        this.rot = new Float32Array([0, 0, 0]); // x, y & z rotation
    }

    update(elapsedTime) {
        const newMS = this.moveSpeed * elapsedTime / 1000; // Time-scaled movement speed
        const newRS = this.rotateSpeed * elapsedTime / 1000; // Time-scaled rotation speed

        let forward = this.forward();
        let right = this.right(forward);
        let moveDist = forward.mul(this.move[2] * newMS).add(right.mul(this.move[0] * newMS));
        if(moveDist.mag()>0){
            //debugger;
        }
        this.eye.add(moveDist);
        this.at.add(moveDist);
        // Y-axis rotation (yaw)
        if (this.rot[1] !== 0) {
            this.pitch(newRS* this.rot[1]);
        }        
        // X-axis rotation (pitch)
        if (this.rot[0] !== 0) {
            this.yaw(newRS * this.rot[0]);
        }
    }

    yaw(angle) { // called by y-axis rotation
        let forward = this.forward();
        let right = this.right(forward);
        var rotMat = new Matrix4().setRotate(angle,right.elements[0],right.elements[1],right.elements[2]);
        var new_forward = rotMat.multiplyVector3(forward);
        this.at.set(this.eye).add(new_forward);
    }

    pitch(angle) { //called by x axis rotation
        let forward = this.forward();
        var rotMat = new Matrix4().setRotate(-1*angle, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
        var new_forward = rotMat.multiplyVector3(forward);

        this.at.set(this.eye).add(new_forward);
    }

    forward() {
        let fwd = new Vector3().set(this.at).sub(this.eye).norm();
        return fwd;
    }

    right(forward) {
        let rt = Vector3.cross(forward, this.up).norm();
        return rt;
    }

    distance() {
        let dist = new Vector3().set(this.at).sub(this.eye).mag();
        return dist;
    }
}
