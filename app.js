document.addEventListener('DOMContentLoaded', () => {
    const colorDisplay = document.getElementById('colorDisplay');
    const configPanel = document.getElementById('configPanel');
    const startButton = document.getElementById('startButton');
    const intervalSlider = document.getElementById('intervalSlider');
    const intervalValue = document.getElementById('intervalValue');
    const showColorNameCheckbox = document.getElementById('showColorName');
    
    let currentColorIndex = -1;
    let changeTimer = null;
    let selectedColors = [];
    
    // Check if we have URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    
    // If we have parameters, hide the config panel and start immediately
    if (urlParams.has('colors') || urlParams.has('interval') || urlParams.has('showName')) {
        parseUrlParams();
        initializeApp();
    } else {
        // Show the config panel and set up event listeners
        setupConfigPanel();
    }
    
    // Set up the configuration panel
    function setupConfigPanel() {
        // Update interval value display when slider changes
        intervalSlider.addEventListener('input', () => {
            intervalValue.textContent = intervalSlider.value;
        });
        
        // Start button click handler
        startButton.addEventListener('click', () => {
            // Get selected colors
            selectedColors = [];
            document.querySelectorAll('input[name="colors"]:checked').forEach(checkbox => {
                selectedColors.push(checkbox.value);
            });
            
            // Validate that at least one color is selected
            if (selectedColors.length === 0) {
                alert('Please select at least one color');
                return;
            }
            
            // Get interval value
            const interval = parseInt(intervalSlider.value) * 1000; // Convert to milliseconds
            
            // Get show color name setting
            const showName = showColorNameCheckbox.checked;
            
            // Update configuration
            CONFIG.colors = selectedColors;
            CONFIG.changeInterval = interval;
            CONFIG.showColorName = showName;
            
            // Build URL parameters
            const params = new URLSearchParams();
            params.set('colors', selectedColors.join(','));
            params.set('interval', intervalSlider.value);
            params.set('showName', showName);
            
            // Update URL without reloading the page
            const newUrl = window.location.pathname + '?' + params.toString();
            window.history.pushState({}, '', newUrl);
            
            // Hide config panel and show color display
            configPanel.style.display = 'none';
            
            // Initialize the app
            initializeApp();
        });
        
        // Initialize checkboxes based on default config
        document.querySelectorAll('input[name="colors"]').forEach(checkbox => {
            if (CONFIG.colors.includes(checkbox.value)) {
                checkbox.checked = true;
            }
        });
        
        // Initialize slider based on default config
        intervalSlider.value = CONFIG.changeInterval / 1000;
        intervalValue.textContent = intervalSlider.value;
        
        // Initialize checkbox based on default config
        showColorNameCheckbox.checked = CONFIG.showColorName;
    }
    
    // Parse URL parameters to override config
    function parseUrlParams() {
        // Override colors if specified in URL
        if (urlParams.has('colors')) {
            const colors = urlParams.get('colors').split(',');
            if (colors.length > 0) {
                CONFIG.colors = colors;
            }
        }
        
        // Override interval if specified in URL
        if (urlParams.has('interval')) {
            const interval = parseInt(urlParams.get('interval'));
            if (!isNaN(interval) && interval > 0) {
                CONFIG.changeInterval = interval * 1000; // Convert to milliseconds
            }
        }
        
        // Override showColorName if specified in URL
        if (urlParams.has('showName')) {
            CONFIG.showColorName = urlParams.get('showName') === 'true';
        }
    }
    
    // Initialize the main app
    function initializeApp() {
        // Show the color display
        colorDisplay.style.display = 'flex';
        
        // Set up maximum brightness
        setMaxBrightness();
        
        // Start color changing
        startColorTimer();
        
        // Prevent display sleep
        preventSleep();
        
        // Ensure we get the full height on iOS devices
        document.documentElement.style.height = `${window.innerHeight}px`;
        
        // Set up click handler for fullscreen
        colorDisplay.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(err => {
                    console.error('Fullscreen request failed:', err);
                });
            }
        });
        
        // Fix for iOS height calculation
        window.addEventListener('resize', () => {
            document.documentElement.style.height = `${window.innerHeight}px`;
        });
    }
    
    // Get random color
    function getRandomColor() {
        return Math.floor(Math.random() * CONFIG.colors.length);
    }
    
    // Update display with new color
    function changeColor() {
        currentColorIndex = getRandomColor();
        const color = CONFIG.colors[currentColorIndex];
        
        // Set background color
        colorDisplay.style.backgroundColor = color;
        
        // Show color name if enabled
        colorDisplay.textContent = CONFIG.showColorName ? color : '';
    }
    
    // Start color changing timer
    function startColorTimer() {
        if (changeTimer) {
            clearInterval(changeTimer);
        }
        
        changeColor();
        changeTimer = setInterval(changeColor, CONFIG.changeInterval);
    }
    
    // Maximum brightness for iOS
    function setMaxBrightness() {
        if (CONFIG.maxBrightness) {
            // Create a full-screen video element with white background
            // This is a trick to force maximum brightness on iOS
            const video = document.createElement('video');
            video.setAttribute('playsinline', '');
            video.setAttribute('autoplay', '');
            video.setAttribute('muted', '');
            video.style.width = '1px';
            video.style.height = '1px';
            video.style.position = 'absolute';
            video.style.opacity = '0.01';
            
            // Add the video element to the DOM
            document.body.appendChild(video);
            
            // Set up a MediaStream with a white background
            const canvas = document.createElement('canvas');
            canvas.width = 1;
            canvas.height = 1;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, 1, 1);
            
            // Try to create a stream and play it to trigger max brightness
            try {
                video.srcObject = canvas.captureStream();
                video.play();
            } catch (e) {
                console.error('Maximum brightness trick failed:', e);
            }
        }
    }
    
    // Prevent display sleep
    function preventSleep() {
        if (navigator.wakeLock) {
            navigator.wakeLock.request('screen').catch(err => {
                console.error('Wake Lock request failed:', err);
            });
        }
    }
    
    // Try to prevent sleep when page is visible
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            preventSleep();
        }
    });
});