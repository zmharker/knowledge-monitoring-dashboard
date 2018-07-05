function quizzes(root, args, context, info) {
      return context.db.query.quizzes({}, info)
}

function quiz(root, args, context, info) {
    return context.db.query.quiz({where:{id:args.id}}, info)
}

function question(root, args, context, info){
    return context.db.query.question({where:{id:args.id}}, info)
}

function option(root, args, context, info){
    return context.db.query.option({where:{id:args.id}})
}

module.exports = {
    quizzes,
    quiz,
    question,
    option
}