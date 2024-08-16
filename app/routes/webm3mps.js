// webm to mp3 conversion, simple
const { exec } = require('child_process');
const path = require('path');

// Function to convert webm to mp3
function convertWebmToMp3(inputFilePath, outputFilePath) {
    // Build the ffmpeg command
    const command = `ffmpeg -i "${inputFilePath}" -q:a 0 -map a "${outputFilePath}"`;

    // Execute the command
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error converting file: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return;
        }
        console.log(`File converted successfully to ${outputFilePath}`);
    });
}

// Example usage:
const inputFilePath = path.join(__dirname, 'input.webm');
const outputFilePath = path.join(__dirname, 'output.mp3');
convertWebmToMp3(inputFilePath, outputFilePath);
