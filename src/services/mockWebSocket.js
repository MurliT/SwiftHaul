// Mock WebSocket for live driver tracking: wss://api.swifthaul.in/ws/tracking
export class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.onmessage = null;
    this.onopen = null;
    this.onclose = null;
    this.readyState = 0; // CONNECTING
    
    console.log(`[MockWebSocket] Connecting to tracking endpoint: ${url}`);
    
    // Simulate connection handshake
    setTimeout(() => {
      this.readyState = 1; // OPEN
      if (this.onopen) {
        this.onopen({ type: 'open' });
      }
      this.startDriverSimulation();
    }, 500);
  }

  send(data) {
    console.log(`[MockWebSocket] Message sent from client:`, data);
  }

  close() {
    this.readyState = 3; // CLOSED
    if (this.timer) {
      clearInterval(this.timer);
    }
    if (this.onclose) {
      this.onclose({ type: 'close' });
    }
    console.log(`[MockWebSocket] Connection closed.`);
  }

  startDriverSimulation() {
    let tick = 0;
    
    // Coordinates representing Indore localities Vijay Nagar -> Palasia -> Rajwada
    const pathCoords = [
      { lat: 22.7533, lng: 75.8937, zone: 'Vijay Nagar', desc: 'Driver near C21 Mall' },
      { lat: 22.7410, lng: 75.8970, zone: 'Vijay Nagar', desc: 'Driver passing LIG Square' },
      { lat: 22.7252, lng: 75.8850, zone: 'Palasia', desc: 'Driver en route near Industry House' },
      { lat: 22.7200, lng: 75.8780, zone: 'Palasia', desc: 'Driver near Palasia Square' },
      { lat: 22.7150, lng: 75.8650, zone: 'Rajwada', desc: 'Driver passing Regal Square' },
      { lat: 22.7244, lng: 75.8569, zone: 'Rajwada', desc: 'Driver arrived at Rajwada Palace' }
    ];

    this.timer = setInterval(() => {
      if (this.readyState !== 1) return;
      
      tick += 1;
      const coordIndex = tick % pathCoords.length;
      const coord = pathCoords[coordIndex];

      // Retrieve orders from localStorage to push updates
      const orders = JSON.parse(localStorage.getItem('sh_orders') || '[]');
      
      // Look for an order that is 'in_transit' or 'pickup' to simulate updates
      const activeOrder = orders.find(o => o.status === 'in_transit' || o.status === 'pickup');
      
      if (activeOrder) {
        // Randomly simulate transitions or driver GPS updates
        let orderUpdated = false;
        
        // 1. Simulate state transitions every few ticks
        if (tick % 4 === 0) {
          if (activeOrder.status === 'pickup') {
            activeOrder.status = 'in_transit';
            activeOrder.deliverySteps[2].status = 'completed'; // Picked Up completed
            activeOrder.deliverySteps[3].status = 'current'; // In Transit current
            activeOrder.deliverySteps[3].time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            orderUpdated = true;
          } else if (activeOrder.status === 'in_transit') {
            activeOrder.status = 'delivered';
            activeOrder.deliverySteps[3].status = 'completed'; // In Transit completed
            activeOrder.deliverySteps[4].status = 'completed'; // Delivered completed
            activeOrder.deliverySteps[4].time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            orderUpdated = true;
            
            // Generate standard notification toast trigger
            window.dispatchEvent(new CustomEvent('swifthaul-toast', {
              detail: { message: `Order ${activeOrder.id} has been DELIVERED successfully!`, type: 'success' }
            }));
          }
        }
        
        if (orderUpdated) {
          localStorage.setItem('sh_orders', JSON.stringify(orders));
        }

        // 2. Dispatch event back to client
        if (this.onmessage) {
          this.onmessage({
            data: JSON.stringify({
              type: 'tracking_update',
              orderId: activeOrder.id,
              status: activeOrder.status,
              lat: coord.lat,
              lng: coord.lng,
              driverName: 'Amit Sharma',
              driverPhone: '+91 98930 12345',
              zone: coord.zone,
              description: coord.desc,
              steps: activeOrder.deliverySteps
            })
          });
        }
      } else {
        // Fallback GPS coordinates for general map view
        if (this.onmessage) {
          this.onmessage({
            data: JSON.stringify({
              type: 'gps_tick',
              drivers: [
                { id: 'D-101', name: 'Amit Sharma', lat: coord.lat, lng: coord.lng, vehicle: 'Two-Wheeler' },
                { id: 'D-102', name: 'Rajesh Khan', lat: 22.7200 + (Math.sin(tick / 5) * 0.01), lng: 75.8780 + (Math.cos(tick / 5) * 0.01), vehicle: 'Three-Wheeler' }
              ]
            })
          });
        }
      }
    }, 4000); // Trigger every 4 seconds for immediate visual feedback
  }
}
