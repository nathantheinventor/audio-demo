import React from 'react';
import './App.css';

class App extends React.Component {
  // @ts-ignore
  ctx: CanvasRenderingContext2D;
  width = 0;
  height = 512;
  audioCtx = new window.AudioContext();
  analyser = this.audioCtx.createAnalyser();
  bufferLength: number = 0;
  started = false;

  onClick = async () => {
    if (this.started) {
      return;
    }
    this.started = true;
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const offset = canvas.getBoundingClientRect();
    canvas.width = offset.width;
    this.width = offset.width;
    canvas.height = this.height;
    this.ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

    this.analyser.fftSize = 8192;
    this.bufferLength = this.analyser.frequencyBinCount;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    const source = this.audioCtx.createMediaStreamSource(stream);
    source.connect(this.analyser);
    this.draw();
  };

  draw = () => {
    requestAnimationFrame(this.draw);
    const dataArray = new Uint8Array(this.bufferLength);
    this.analyser.getByteFrequencyData(dataArray);
    this.displayData(dataArray);
  };

  getColor(n: number): number[] {
    // Convert a number to an rgb value based on https://www.rapidtables.com/convert/color/hsl-to-rgb.html
    const max = 255;
    const h = 360 * Math.abs(n) / max;
    const C = 255;
    const X = C * (1 - Math.abs((h / 60) % 2 - 1));
    if (0 <= h && h <= 60) {
      return [C, X, 0, 255];
    } else if (60 <= h && h <= 120) {
      return [X, C, 0, 255];
    } else if (120 <= h && h <= 180) {
      return [0, C, X, 255];
    } else if (180 <= h && h <= 240) {
      return [0, X, C, 255];
    } else if (240 <= h && h <= 300) {
      return [X, 0, C, 255];
    } else if (300 <= h && h <= 360) {
      return [C, 0, X, 255];
    }
    return [0, 0, 0, 0];
  }

  displayData(d: Uint8Array) {
    const imageData = this.ctx.getImageData(0, 0, this.width, this.height);
    // Step 1: shift the existing imagery over
    for (let i = 0; i < this.height; i++) {
      for (let j = 0; j < this.width - 1; j++) {
        const n = 4 * (i * this.width + j);
        imageData.data[n + 0] = imageData.data[n + 4];
        imageData.data[n + 1] = imageData.data[n + 5];
        imageData.data[n + 2] = imageData.data[n + 6];
        imageData.data[n + 3] = imageData.data[n + 7];
      }
    }

    // Step 2: make the new imagery in the right column
    let n = 4 * (this.width - 1);
    for (let i = 0; i < Math.min(d.length, this.height); i++) {
      const x = d[i];
      const color = this.getColor(x);
      imageData.data[n + 0] = color[0];
      imageData.data[n + 1] = color[1];
      imageData.data[n + 2] = color[2];
      imageData.data[n + 3] = color[3];
      n += 4 * this.width;
    }

    this.ctx.putImageData(imageData, 0, 0);
  }

  render() {
    return (
      <div className="App">
        <canvas id="canvas" style={{ width: '100%', height: this.height }} onClick={this.onClick}/>
      </div>
    );
  }
}

export default App;
