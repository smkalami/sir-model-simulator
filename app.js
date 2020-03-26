$(document).ready(function(){
    link_input_monitors();
    $('input[type=range]').eq(0).change();
});

var dont_simulate = true;

function link_input_monitors() {
    $('.input-monitor').each(function(index){
        var e = $(this);
        var ds = e.attr('data-source');
        if(ds != '') {
            var d = $('#' + ds);
            d.change(function(){
                e.html(d.val());
                simulate_sir_model();
            });
            d.change();
        }
    });
    dont_simulate = false;
}

var I0, S0, R0, X0, alpha, beta, tmax, simout;

function simulate_sir_model() {

    I0 = $('#initial-infections').val()/100;
    S0 = 1 - I0;
    R0 = 0;
    X0 = [S0, I0, R0];

    alpha = $('#transmission-rate').val();
    beta = $('#recovery-rate').val();
    tmax = $('#timespan').val();
    dt = 0.1;

    if(!dont_simulate) {
        simout = ode_solve_using_rk4(sir_model, X0, tmax, dt);
        update_plot_data();
    }

}

function sir_model(t, X) {
    
    var dX = [
        -alpha * X[0] * X[1],
        alpha * X[0] * X[1] - beta * X[1],
        beta * X[1]
    ];

    return dX;

}

function ode_solve_using_rk4 (f, X0, tmax, dt) {

    var t = 0;
    var nx = X0.length;
    var nt = Math.round(tmax/dt);
    
    var T = [t];
    var X = [X0.slice()];

    for (let k = 0; k < nt; k++) {
        
        t1 = t;
        X1 = X[k].slice();
        K1 = f(t1, X1);

        t2 = t + dt/2;
        X2 = X[k].slice();
        for (let i = 0; i < nx; i++) {
            X2[i] += K1[i]*dt/2;
        }
        K2 = f(t2, X2);

        t3 = t + dt/2;
        X3 = X[k].slice();
        for (let i = 0; i < nx; i++) {
            X3[i] += K2[i]*dt/2;
        }
        K3 = f(t3, X3);

        t4 = t + dt;
        X4 = X[k].slice();
        for (let i = 0; i < nx; i++) {
            X4[i] += K3[i]*dt;
        }
        K4 = f(t4, X4);
        
        Xnew = X[k].slice();
        for (let i = 0; i < nx; i++) {
            Xnew[i] += (K1[i] + 2*K2[i] + 2*K3[i] + K4[i])*dt/6;
        }

        t = (k+1)*dt;
        T.push(t.toFixed(1).replace('.0', ''));
        X.push(Xnew);
        
    }

    out = {
        T: T,
        X: X
    };

    for (let i = 1; i <= nx; i++) {
        var Xi = [];
        for (let k = 0; k < X.length; k++) {
            Xi.push(X[k][i - 1].toFixed(4));
        }
        out['X' + i] = Xi;
    }

    return out;

}

var config;
var plot;

var chart_colors = {
	red: 'rgb(255, 99, 132)',
	orange: 'rgb(255, 159, 64)',
	yellow: 'rgb(255, 205, 86)',
	green: 'rgb(75, 192, 192)',
	blue: 'rgb(54, 162, 235)',
	purple: 'rgb(153, 102, 255)',
	grey: 'rgb(201, 203, 207)'
};

function create_plot() {

    if(plot != null) return;

    Chart.defaults.global.defaultFontFamily = '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji"';

    config = {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Susceptible',
                    backgroundColor: chart_colors.blue,
                    borderColor: chart_colors.blue,
                    data: [],
                    fill: false,
                },
                {
                    label: 'Infected',
                    backgroundColor: chart_colors.red,
                    borderColor: chart_colors.red,
                    data: [],
                    fill: false,
                },
                {
                    label: 'Recovered',
                    backgroundColor: chart_colors.green,
                    borderColor: chart_colors.green,
                    data: [],
                    fill: false,
                }
            ]
        },
        options: {
            responsive: true,
            elements: {
                point:{
                    radius: 0
                }
            },
            title: {
                display: true,
                text: 'SIR Model Simulatoion'
            },
            scales: {
                xAxes: [{
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: 'Day'
                    },
                    ticks: {
                        maxTicksLimit: 10,
                    }
                }],
                yAxes: [{
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: 'Fraction of Population'
                    },
                    ticks: {
                        callback: function(value, index, values) {
                            return (100*value) + '%';
                        }
                    }
                }]
            }
        }
    };

    var ctx = document.getElementById('canvas').getContext('2d');
    plot = new Chart(ctx, config);

}

function update_plot_data() {

    if(plot == null) {
        create_plot();
    }

    config.data.labels = simout.T;
    config.data.datasets[0].data = simout.X1;
    config.data.datasets[1].data = simout.X2;
    config.data.datasets[2].data = simout.X3;
    // config.options.scales.xAxes[0].ticks.max = tmax;
    plot.update();

}