const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const database = path.join(__dirname, "todoApplication.db");
const format = require("date-fns/format");
const valid = require("date-fns/isValid");
const app = express();
app.use(express.json())
let db = null;
const intializedbserver = async () => {
  try {
    db = await open({
      filename: database,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server running");
    });
  } catch (e) {
    console.log(`DB error ${e.message}`);
    process.exit(1);
  }
};
intializedbserver();
const hasstatusandpriority = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.priority !== undefined
  );
};
const haspriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hascategory = (requestQuery) => {
  return requestQuery.category !== undefined;
};
const hasstatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};
const hasstatusandcategory = (requestQuery) => {
  return requestQuery.category !== undefined && requestQuery.status !== undefined;
};
const haspriorityandcategory = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};
const hasduedate = (requestQuery) => {
  return requestQuery.dueDate !== undefined;
};
const hasSearch = (requestQuery) => {
  return requestQuery.search_q !== undefined;
}
const eachtodotask = (eachtodo) => {
  return {
    id: eachtodo.id,
    todo: eachtodo.todo,
    priority: eachtodo.priority,
    status: eachtodo.status,
    category: eachtodo.category,
    dueDate: eachtodo.due_date,
  };
};
app.get("/todos/", async (request, response) => {
  let data = null;
  let gettodosquery = "";
  const { search_q = "", priority, status, category, dueDate } = request.query;
  switch (true) {
    case haspriority(request.query):
      if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
        gettodosquery = `select * from todo where todo like '%${search_q}%' and priority='${priority}'`;
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hascategory(request.query):
      if (
        category === "WORK" || category === "HOME" || category === "LEARNING") {
        gettodosquery = `select * from todo where todo like'%${search_q}%' and category='${category}'`;
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case hasstatusandpriority(request.query):
      if (status === "TO DO" ||status === "IN PROGRESS" || status === "DONE") {
        if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
          gettodosquery = `select * from todo where priority = '${priority}' and status='${status}'`;
      } else {
        response.status(400)
        response.send("Invalid Todo Priority")
    }
 } else {
        response.status(400)
        response.send("Invalid Todo Status")
    }
      break;
    case hasstatusandcategory(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE" ) {
        if (category === "WORK" || category === "HOME" || category === "LEARNING") {
        gettodosquery = `select * from todo where category='${category}' and status = '${status}'`;
    } else {
          response.status(400)
          response.send("Invalid Todo Category")
      }
     } else {
          response.status(400)
          response.send("Invalid Todo Status")
      }
      break;
    case hasstatus(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        gettodosquery = `select * from todo where status='${status}';`;
      } else{
          response.status(400)
          response.send("Invalid Todo Status");
      }
      break;
    case hasSearch(request.query):
        if (search_q === 'Buy') {
          gettodosquery = `select * from todo where todo like '%${search_q}%';`;
        }
      break;
    case haspriorityandcategory(request.query):
      if (category === 'LEARNING' || category === 'WORK' || category === 'HOME') {
        if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
          gettodosquery = `select * from todo where category='${category}' and priority='${priority}';`;
      } else {
          response.status(400)
          response.send("Invalid Todo Priority")
      }
      } else {
          response.status(400)
          response.send("Invalid Todo Category")
      }
      break;
    default:
    gettodosquery = `select * from todo;`;
  }
  data = await db.all(gettodosquery);
  response.send(data.map((eachtodo) => eachtodotask(eachtodo)));
});
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const todoOne = `select * from todo where id=${todoId}`;
  const res = await db.get(todoOne);
  response.send(eachtodotask(res));
});
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (date !== undefined && valid(new Date(date))) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    const todotask = `select * from todo where due_date='${newDate}';`;
  const res = await db.all(todotask);
  response.send(res.map((eachtodo) => eachtodotask(eachtodo)));
  } else {
      response.status(400);
      response.send("Invalid Due Date")
  }
});
app.post("/todos/", async (request, response) => {
  const {id, todo, category, priority, status, due_date} = request.body;
  if (priority === 'HIGH' || priority === 'LOW' || priority === 'MEDIUM') {
    if (category === 'WORK' || category === 'HOME' || category === 'LEARNING') {
      if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
        if (due_date !== undefined && valid(new Date(due_date))) {
          const newDate = format(new Date(due_date),"yyyy-MM-dd");
          const addTodo = `insert into todo(id, todo, priority, status, category, due_date) values (${id}, '${todo}', '${priority}', '${status}', '${category}', '${newDate}');`;
          await db.run(addTodo)
          response.send('Todo Successfully Added');
        } else{
            response.status(400);
            response.send("Invalid Due Date")
        }
      } else {
        response.status(400)
        response.send("Invalid Todo Status");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
});
app.put("/todos/:todoId/", async (request, response) => {
    const {todoId} = request.params
    const {todoDetails} = request.body
    const {todo, priority, status, dueDate, category} = todoDetails
    switch (true) {
        case hasstatus(request.body):
            if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
              const updateStatus = `update todo set status='${status}' where id=${todoId};`;
              await db.run(updateStatus)
              response.send("Status Updated")
            } else {
                response.status(400)
                response.send("Invalid Todo Status")
            }
            break;
        case hascategory(request.body) :
           if (category === 'WORK' || category === 'HOME' || category === 'LEARNING') {
             const updateCategory = `update todo set category='${category}' where id=${todoId};`;
              await db.run(updateCategory)
              response.send("Category Updated")
            }
            else {
                response.status(400)
                response.send("Invalid Todo Category")
            }
        
          break;
        case haspriority(request.body) :
            if (priority === 'HIGH' || priority === 'LOW' || priority === 'MEDIUM') {
                const updatePriority = `update todo set priority='${priority}' where id=${todoId};`;
                await db.run(updatePriority)
                response.send("Priority Updated")
            }
            else {
                response.status(400)
                response.send("Invalid Todo Priority")
            }
        
        break;
        case hasduedate(request.body) :
          if (valid(new Date(dueDate))) {
            const newDate = format(new Date(dueDate), "yyyy-MM-dd");
            const todotask = `update todo set due_date='${newDate}' where id=${todoId};`;
            await db.run(todotask);
           response.send("Due Date Updated");
      } else {
      response.status(400);
      response.send("Invalid Due Date")
     }
    
    break;
    default:
        const updateTodo = `update todo set todo='${todo}' where id=${todoId};`;
        await db.run(updateTodo)
        response.send("Todo Updated")
        break;
    }
});
app.delete("/todos/:todoId/", async(request, response) => {
    const todoId = request.params
    const deleteQuery = `delete from todo where id=${todoId};`;
    await db.run(deleteQuery)
    response.send("Todo Deleted")
})

module.exports = app;
