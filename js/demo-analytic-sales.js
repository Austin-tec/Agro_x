(function(){
    const ctx = document.getElementById('salesChart').getContext('2d');
    const rangeSelect = document.getElementById('rangeSelect');
    const regenBtn = document.getElementById('regen');
    const totalSalesEl = document.getElementById('totalSales');
    const avgSalesEl = document.getElementById('avgSales');
    const topDayEl = document.getElementById('topDay');

    function generateData(days){
        const labels = [];
        const data = [];
        const today = new Date();
        for(let i=days-1;i>=0;i--){
            const d = new Date(today);
            d.setDate(today.getDate()-i);
            labels.push(`${d.getMonth()+1}/${d.getDate()}`);
            // Demo sales value (random-ish, but smooth)
            const base = Math.round(50 + Math.sin(i/5)*30 + Math.random()*60);
            data.push(Math.max(0, base));
        }
        return {labels,data};
    }

    const cfg = {
        type: 'bar',
        data: { labels: [], datasets: [{ label: 'Sales (USD)', data: [], backgroundColor: 'rgba(60,150,60,0.9)' }] },
        options: {
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } },
            plugins: { legend: { display: false } }
        }
    };

    const chart = new Chart(ctx, cfg);

    function updateStats(labels, data){
        const total = data.reduce((s,v)=>s+v,0);
        const avg = (total / (data.length||1)).toFixed(2);
        let topIdx = 0;
        for(let i=1;i<data.length;i++) if(data[i]>data[topIdx]) topIdx = i;
        totalSalesEl.textContent = `$${total.toLocaleString()}`;
        avgSalesEl.textContent = `$${Number(avg).toLocaleString()}`;
        topDayEl.textContent = `${labels[topIdx]} ($${data[topIdx]})`;
    }

    function renderForRange(days){
        const d = generateData(Number(days));
        chart.data.labels = d.labels;
        chart.data.datasets[0].data = d.data;
        chart.update();
        updateStats(d.labels, d.data);
    }

    rangeSelect.addEventListener('change', ()=>{
        renderForRange(rangeSelect.value);
    });

    regenBtn.addEventListener('click', ()=>{
        renderForRange(rangeSelect.value);
    });

    // initial
    renderForRange(rangeSelect.value);
})();