document.addEventListener('DOMContentLoaded', function() {
  // Plinko elements
  const statsContainer = document.getElementById('statsContainer');
  const resultsTable = document.getElementById('resultsTable').getElementsByTagName('tbody')[0];
  const multipliersTable = document.getElementById('multipliersTable').getElementsByTagName('tbody')[0];
  const returnChart = document.getElementById('returnChart');
  // Keno elements
  const kenoTotalBets = document.getElementById('kenoTotalBets');
  const kenoReturnChart = document.getElementById('kenoReturnChart');
  const kenoNumberGrid = document.getElementById('kenoNumberGrid');
  const resetButton = document.getElementById('resetButton');
  function calculateStats(bets) {
      const totalBets = bets.length;
      const totalPayout = bets.reduce((sum, bet) => sum + (bet.payoutMultiplier * 1), 0);
      const totalAmount = totalBets;
      const averageReturn = totalAmount > 0 ? (totalPayout / totalAmount * 100).toFixed(2) : 0;
      const profitLoss = (totalPayout - totalAmount).toFixed(8);
      return { totalBets, averageReturn, profitLoss };
  }
  function updateStats(stats) {
      const isHot = parseFloat(stats.averageReturn) > 100;
      document.getElementById('totalBets').textContent = stats.totalBets;
      document.getElementById('averageReturn').textContent = `${stats.averageReturn}%`;
      document.getElementById('averageReturn').className = isHot ? 'hot' : 'cold';
      document.getElementById('profitLoss').textContent = stats.profitLoss;
      document.getElementById('profitLoss').className = parseFloat(stats.profitLoss) > 0 ? 'hot' : 'cold';
      document.getElementById('status').textContent = isHot ? 'HOT' : 'COLD';
      document.getElementById('status').className = isHot ? 'hot' : 'cold';
  }
  function updateHistoricalResults(results) {
      resultsTable.innerHTML = '';
      results.slice(0, 10).forEach(bet => {
          const row = resultsTable.insertRow();
          row.insertCell(0).textContent = bet.payoutMultiplier;
          row.insertCell(1).textContent = `${bet.amount} ${bet.currency.toUpperCase()}`;
          row.insertCell(2).textContent = `${bet.payout} ${bet.currency.toUpperCase()}`;
          row.insertCell(3).textContent = bet.state.risk;
      });
  }
  function updateAllMultipliers(multipliers, betsSince, lastOccurrence) {
      multipliersTable.innerHTML = '';
      Object.keys(multipliers).sort((a, b) => parseFloat(b) - parseFloat(a)).forEach(multiplier => {
        const row = multipliersTable.insertRow();
        row.insertCell(0).textContent = multiplier;
        row.insertCell(1).textContent = multipliers[multiplier];
        row.insertCell(2).textContent = betsSince[multiplier] || 0;
        row.insertCell(3).textContent = lastOccurrence[multiplier] !== undefined ? lastOccurrence[multiplier] : 'N/A';
      });
    }
  function createSimpleChart(canvas, data, labels, title) {
      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;
      const padding = { top: 40, right: 20, bottom: 40, left: 60 };
      const chartWidth = width - padding.left - padding.right;
      const chartHeight = height - padding.top - padding.bottom;
      // Clear the canvas
      ctx.clearRect(0, 0, width, height);
      // Set colors
      const textColor = '#e0e0e0';
      const lineColor = '#4CAF50';
      const gridColor = 'rgba(255, 255, 255, 0.1)';
      // Draw title
      ctx.fillStyle = textColor;
      ctx.font = 'bold 16px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(title, width / 2, padding.top / 2);
      // Calculate scales
      const maxValue = Math.max(...data, 0);
      const minValue = Math.min(...data, 0);
      const range = maxValue - minValue;
      // Draw axes
      ctx.beginPath();
      ctx.strokeStyle = textColor;
      ctx.lineWidth = 2;
      ctx.moveTo(padding.left, padding.top);
      ctx.lineTo(padding.left, height - padding.bottom);
      ctx.lineTo(width - padding.right, height - padding.bottom);
      ctx.stroke();
      // Draw grid lines and y-axis labels
      ctx.font = '12px Inter';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      const yAxisSteps = 5;
      for (let i = 0; i <= yAxisSteps; i++) {
          const y = padding.top + (chartHeight / yAxisSteps) * i;
          const value = maxValue - (range / yAxisSteps) * i;
          // Grid line
          ctx.beginPath();
          ctx.strokeStyle = gridColor;
          ctx.moveTo(padding.left, y);
          ctx.lineTo(width - padding.right, y);
          ctx.stroke();
          // Y-axis label
          ctx.fillStyle = textColor;
          ctx.fillText(value.toFixed(2), padding.left - 10, y);
      }
      // Draw data line
      ctx.beginPath();
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 2;
      const dataStep = Math.max(1, Math.floor(data.length / (chartWidth / 5))); // Adjust step size based on chart width
      for (let i = 0; i < data.length; i += dataStep) {
          const x = padding.left + (i / (data.length - 1)) * chartWidth;
          const y = height - padding.bottom - ((data[i] - minValue) / range) * chartHeight;
          if (i === 0) {
              ctx.moveTo(x, y);
          } else {
              ctx.lineTo(x, y);
          }
      }
      ctx.stroke();
      // Draw x-axis labels
      ctx.fillStyle = textColor;
      ctx.font = '12px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const xLabelStep = Math.max(1, Math.floor(labels.length / 5)); // Show max 5 labels
      for (let i = 0; i < labels.length; i += xLabelStep) {
          const x = padding.left + (i / (labels.length - 1)) * chartWidth;
          ctx.fillText(labels[i], x, height - padding.bottom + 10);
      }
  }
  function updateReturnChart(seedResults) {
      const returns = calculateReturnData(seedResults);
      const labels = returns.map((_, index) => (index + 1).toString());
      createSimpleChart(returnChart, returns, labels, 'Cumulative Return');
  }
  function calculateReturnData(seedResults) {
      let cumulativeReturn = 0;
      return seedResults.map(bet => {
          cumulativeReturn += bet.payoutMultiplier - 1;
          return cumulativeReturn;
      });
  }
  function calculateKenoStats(kenoResults) {
      const totalBets = kenoResults.length;
      const hotNumbers = {};
      for (let i = 1; i <= 40; i++) {
          hotNumbers[i] = 0;
      }
      kenoResults.forEach(bet => {
          if (Array.isArray(bet.state.drawnNumbers)) {
              bet.state.drawnNumbers.forEach(number => {
                  const adjustedNumber = parseInt(number) + 1;  // Adjust 0-39 to 1-40
                  if (!isNaN(adjustedNumber) && adjustedNumber >= 1 && adjustedNumber <= 40) {
                      hotNumbers[adjustedNumber]++;
                  } else {
                      console.warn('Invalid number encountered:', number);
                  }
              });
          } else {
              console.error('drawnNumbers is not an array:', bet.state.drawnNumbers);
          }
      });
      return { totalBets, bets: kenoResults, hotNumbers };
  }
  function updateKenoStats(kenoData) {
      kenoTotalBets.textContent = kenoData.totalBets;
      updateKenoNumberGrid(kenoData.hotNumbers);
  }
  function updateKenoNumberGrid(hotNumbers) {
      kenoNumberGrid.innerHTML = '';
      const validOccurrences = Object.values(hotNumbers).filter(value => !isNaN(value));
      const maxOccurrence = Math.max(...validOccurrences, 1);
      for (let i = 1; i <= 40; i++) {
          const numberCell = document.createElement('div');
          numberCell.className = 'number-cell';
          const occurrences = hotNumbers[i] || 0;
          const intensity = occurrences / maxOccurrence;
          const hue = intensity * 120;
          const saturation = 70;
          const lightness = 70 - intensity * 40;
          numberCell.style.backgroundColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
          numberCell.style.color = lightness > 50 ? '#000' : '#fff';
          numberCell.style.textShadow = lightness > 50 
              ? '0 0 1px rgba(255,255,255,0.5)'
              : '0 0 1px rgba(0,0,0,0.5)';
          numberCell.innerHTML = `<span class="number">${i}</span><span class="occurrences">${occurrences}</span>`;
          kenoNumberGrid.appendChild(numberCell);
      }
  }
  function updateActiveTab(activeGame) {
      console.log('Updating active tab to:', activeGame);
      const tabs = document.querySelectorAll('.tablinks');
      tabs.forEach(tab => {
        if (tab.dataset.tab === activeGame) {
          tab.classList.add('active');
          openTab(null, activeGame);
        } else {
          tab.classList.remove('active');
        }
      });
    }
    function openTab(evt, tabName) {
      console.log('Opening tab:', tabName);
      const tabcontent = document.getElementsByClassName("tabcontent");
      for (let i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
      }
      document.getElementById(tabName).style.display = "block";
      const tablinks = document.getElementsByClassName("tablinks");
      for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].classList.remove("active");
      }
      // If evt is null, find the tab button by its data-tab attribute
      if (evt) {
        evt.currentTarget.classList.add("active");
      } else {
        document.querySelector(`.tablinks[data-tab="${tabName}"]`).classList.add("active");
      }
    }
    let initialLoadDone = false;
    function loadData() {
      chrome.storage.local.get(['seedResults', 'allMultipliers', 'betsSinceMultiplier', 'lastOccurrenceMultiplier', 'kenoResults', 'lastPlayedGame'], function(result) {
        if (!initialLoadDone) {
          const activeGame = result.lastPlayedGame || 'Plinko';
          updateActiveTab(activeGame);
          initialLoadDone = true;
        }
        // Plinko data
        if (result.seedResults && Object.keys(result.seedResults).length > 0) {
          const seed = Object.keys(result.seedResults)[0];
          const currentSeedBets = result.seedResults[seed];
          const multipliers = result.allMultipliers && result.allMultipliers[seed];
          const betsSince = result.betsSinceMultiplier && result.betsSinceMultiplier[seed];
          const lastOccurrence = result.lastOccurrenceMultiplier && result.lastOccurrenceMultiplier[seed];
          if (currentSeedBets && currentSeedBets.length > 0) {
            const stats = calculateStats(currentSeedBets);
            updateStats(stats);
            updateHistoricalResults(currentSeedBets);
            updateReturnChart(currentSeedBets);
          } else {
            statsContainer.innerHTML = '<div class="stats-header">No bet data available for the current seed.</div>';
            resultsTable.innerHTML = '<tr><td colspan="4">No recent bets available.</td></tr>';
          }
          if (multipliers) {
            updateAllMultipliers(multipliers, betsSince, lastOccurrence);
          } else {
            multipliersTable.innerHTML = '<tr><td colspan="4">No multiplier data available.</td></tr>';
          }
        }            // Keno data
          if (result.kenoResults && Object.keys(result.kenoResults).length > 0) {
              const kenoSeed = Object.keys(result.kenoResults)[0];
              const kenoData = calculateKenoStats(result.kenoResults[kenoSeed]);
              updateKenoStats(kenoData);
          } else {
              kenoTotalBets.textContent = '0';
              kenoReturnChart.getContext('2d').clearRect(0, 0, kenoReturnChart.width, kenoReturnChart.height);
              updateKenoNumberGrid({});
          }
      });
  }
  function openTab(evt, tabName) {
      const tabcontent = document.getElementsByClassName("tabcontent");
      for (let i = 0; i < tabcontent.length; i++) {
          tabcontent[i].style.display = "none";
      }
      document.getElementById(tabName).style.display = "block";
      if (evt) {
          const tablinks = document.getElementsByClassName("tablinks");
          for (let i = 0; i < tablinks.length; i++) {
              tablinks[i].classList.remove("active");
          }
          evt.currentTarget.classList.add("active");
      }
  }
  resetButton.addEventListener('click', function() {
      chrome.runtime.sendMessage({ type: 'RESET_STATS' }, function(response) {
        if (response && response.success) {
          console.log('Stats reset successfully');
          clearDisplayedData();
          loadData(); // Reload data after reset
        } else {
          console.error('Failed to reset stats');
        }
      });
    });
    function clearDisplayedData() {
      // Clear Plinko data
      document.getElementById('totalBets').textContent = '-';
      document.getElementById('averageReturn').textContent = '-';
      document.getElementById('profitLoss').textContent = '-';
      document.getElementById('status').textContent = '-';
      document.getElementById('resultsTable').getElementsByTagName('tbody')[0].innerHTML = '';
      document.getElementById('multipliersTable').getElementsByTagName('tbody')[0].innerHTML = '';
      // Clear Keno data
      document.getElementById('kenoTotalBets').textContent = '-';
      document.getElementById('kenoNumberGrid').innerHTML = '';
      // Clear charts
      const returnChart = document.getElementById('returnChart');
      if (returnChart) {
        const ctx = returnChart.getContext('2d');
        ctx.clearRect(0, 0, returnChart.width, returnChart.height);
      }
    }
  // Initialize tabs
  document.getElementById("Plinko").style.display = "block";
  document.getElementsByClassName("tablinks")[0].className += " active";
  // Add click event listeners to tab buttons
  const tabButtons = document.getElementsByClassName("tablinks");
  for (let i = 0; i < tabButtons.length; i++) {
      tabButtons[i].addEventListener("click", function(event) {
          openTab(event, event.target.dataset.tab);
      });
  }
  loadData();
  setInterval(loadData, 5000);
});