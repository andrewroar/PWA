let transactions = [];
let myChart;

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").then((reg) => {
      console.log("We found your service worker file!", reg);
    });
  });
}

fetch("/api/transaction")
  .then((response) => {
    return response.json();
  })
  .then((data) => {
    // save db data on global variable
    transactions = data;

    populateTotal();
    populateTable();
    populateChart();
  });

function populateTotal() {
  // reduce transaction amounts to a single total value
  let total = transactions.reduce((total, t) => {
    return total + parseInt(t.value);
  }, 0);

  let totalEl = document.querySelector("#total");
  totalEl.textContent = total;
}

function populateTable() {
  let tbody = document.querySelector("#tbody");
  tbody.innerHTML = "";

  transactions.forEach((transaction) => {
    // create and populate a table row
    let tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${transaction.name}</td>
      <td>${transaction.value}</td>
    `;

    tbody.appendChild(tr);
  });
}

function populateChart() {
  // copy array and reverse it
  let reversed = transactions.slice().reverse();
  let sum = 0;

  // create date labels for chart
  let labels = reversed.map((t) => {
    let date = new Date(t.date);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  });

  // create incremental values for chart
  let data = reversed.map((t) => {
    sum += parseInt(t.value);
    return sum;
  });

  // remove old chart if it exists
  if (myChart) {
    myChart.destroy();
  }

  let ctx = document.getElementById("myChart").getContext("2d");

  myChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Total Over Time",
          fill: true,
          backgroundColor: "#6666ff",
          data,
        },
      ],
    },
  });
}

function sendTransaction(isAdding) {
  let nameEl = document.querySelector("#t-name");
  let amountEl = document.querySelector("#t-amount");
  let errorEl = document.querySelector(".form .error");

  // validate form
  if (nameEl.value === "" || amountEl.value === "") {
    errorEl.textContent = "Missing Information";
    return;
  } else {
    errorEl.textContent = "";
  }

  // create record
  let transaction = {
    name: nameEl.value,
    value: amountEl.value,
    date: new Date().toISOString(),
  };

  // if subtracting funds, convert amount to negative number
  if (!isAdding) {
    transaction.value *= -1;
  }

  // add to beginning of current array of data
  transactions.unshift(transaction);

  // re-run logic to populate ui with new record
  populateChart();
  populateTable();
  populateTotal();

  // also send to server
  fetch("/api/transaction", {
    method: "POST",
    body: JSON.stringify(transaction),
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      if (data.errors) {
        errorEl.textContent = "Missing Information";
      } else {
        // clear form
        nameEl.value = "";
        amountEl.value = "";
      }
    })
    .catch((err) => {
      // fetch failed, so save in indexed db
      saveRecord(transaction);

      // clear form
      nameEl.value = "";
      amountEl.value = "";
    });
}

document.querySelector("#add-btn").onclick = function () {
  sendTransaction(true);
};

document.querySelector("#sub-btn").onclick = function () {
  sendTransaction(false);
};

///////////////////////////

const saveRecord = (item) => {
  console.log(item);
  const db = indexedDB.open("budgetDB", 1);

  // Create an object store inside the onupgradeneeded method.
  db.onupgradeneeded = ({ target }) => {
    const budgets = target.result.createObjectStore("budgetLists", {
      keyPath: "value",
    });
    budgets.createIndex("budget", "name");
  };

  //////////////////////

  // On success console the result.
  db.onsuccess = ({ target }) => {
    console.log("what s item on success");
    console.log(item);
    const transaction = target.result.transaction(["budgetLists"], "readwrite");
    const budgets = transaction.objectStore("budgetLists");
    budgets.add(item);

    const getbudgets = budgets.getAll();
    console.log(getbudgets);
  };
};

window.addEventListener("offline", () => {
  console.log("potato internet :(");
});

window.addEventListener("online", () => {
  const db = indexedDB.open("budgetDB", 1);
  db.onsuccess = ({ target }) => {
    const transaction = target.result.transaction(["budgetLists"], "readwrite");
    const budgets = transaction.objectStore("budgetLists");

    const getbudgets = budgets.getAll();

    getbudgets.onsuccess = ({ target }) => {
      event.target.result.forEach((element) => {
        fetch("/api/transaction", {
          method: "POST",
          body: JSON.stringify(element),
          headers: {
            Accept: "application/json, text/plain, */*",
            "Content-Type": "application/json",
          },
        })
          .then((response) => {
            return response.json();
          })
          .then((data) => {
            if (data.errors) {
              errorEl.textContent = "Missing Information";
            }
          })
          .catch((err) => {
            // fetch failed, so save in indexed db
            saveRecord(transaction);
          });
      });
    };

    //I big-brained this

    budgets.clear();

    //indexedDB.deleteDatabase("budgetDB");
  };
});
