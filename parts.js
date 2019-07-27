vue-cli-service electron:build -p always

"name": "exam_shuffler_v2",
  "version": "2.1.14",
  "private": true,
  "description": "This is an application that shuffls questions of MCQ questions.",
  "author": "Mohammed Alshaharni",
  "repository": {
    "type": "git",
    "url": "https://github.com/mmogib/exam_shuffler_v2.git"
  },
 



-----
import Datastore from 'nedb'

import shuffle from 'lodash/shuffle'
export { parse_examdoc } from './exam'
export { examDocument } from './templates/'

import {
  preamble,
  examcover,
  coverpagemaster,
  coverpage,
  header,
  answerkey,
  answercount,
  spaceAfterQuestionBody,
  spaceBetweenQuestions
} from './templates/examparts'

export const settings = {
  University: 'Kink Fahd University of Petroleum and Minerals',
  Department: 'Mathematics and Statistics'
}

export const currentSem = () => {
  const now = new Date()
  const month = now.getMonth() + 1
  let year = parseInt(
    now
      .getFullYear()
      .toString()
      .substr(2.2)
  )
  let sem
  if (month >= 1 && month < 9) {
    year--
  }

  if (month >= 1 && month < 6) {
    sem = 2
  } else if (month >= 6 && month < 9) {
    sem = 3
  } else {
    sem = 1
  }
  year *= 10
  return year + sem
}
export const config = {
  courseCode: '',
  examDate: '',
  examTitle: '',
  examGroups: [], //[{name, noq}]
  numOfAnswers: 5,
  numOfQuestions: 0,
  numOfVersions: 4,
  Term: currentSem(),
  TimeAllowed: ''
}

export const questionOtion = {
  correct: false,
  text: '',
  order: 0,
  pinned: false
}
export const question = {
  questionBody: '',
  options: [],
  pinned: false
}

export const code = {
  settings,
  config,
  questions: [],
  master: false,
  versionName: '',
  numOfPages: 0
}

export const partials = {
  preamble,
  examcover,
  coverpagemaster,
  coverpage,
  header,
  answerkey: answerkey(),
  answercount: answercount(),
  spaceAfterQuestionBody,
  spaceBetweenQuestions
}

export const item_exists = (db, name) => {
  return new Promise((resolve, reject) => {
    db.count({ name }, (err, count) => {
      if (err) reject(err)
      if (count === 0) {
        reject(new Error(`${name} not found.`))
      } else {
        resolve(count)
      }
    })
  })
}

export const get_item = (db, where = {}) => {
  return new Promise((resolve, reject) => {
    db.find({ ...where }, (err, docs) => {
      if (err) reject(err)
      if (docs.length === 0) {
        reject(new Error(`Not found..`))
      } else {
        resolve(docs[0])
      }
    })
  })
}

export const get_projects = db => {
  return new Promise(resolve => {
    db.find({ project: true }, (err, docs) => {
      if (err) resolve([])
      resolve(docs)
    })
  })
}

const get_setting = db => {
  return new Promise((resolve, reject) => {
    db.find({ name: 'setting' }, (err, docs) => {
      if (err) reject(err)
      if (docs.length === 0) {
        reject(new Error('No initial setting'))
      } else {
        resolve(docs[0])
      }
    })
  })
}
const set_setting = (db, setting) => {
  return new Promise((resolve, reject) => {
    db.insert(setting, (err, doc) => {
      if (err) reject(err)
      resolve(doc)
    })
  })
}

export const new_item = (db, exam) => {
  return new Promise((resolve, reject) => {
    db.insert({ ...exam }, (err, doc) => {
      if (err) reject(err)
      resolve(doc)
    })
  })
}

export const update_item = (db, obj) => {
  return new Promise((resolve, reject) => {
    db.update({ name: obj.name }, { ...obj }, {}, (err, doc) => {
      if (err) reject(err)
      resolve(doc)
    })
  })
}

export const save_item = async (db, exam) => {
  try {
    await item_exists(db, exam.name)
    return update_item(db, exam)
  } catch (error) {
    return new_item(db, exam)
  }
}
export const update_exam = (db, examObj) => {
  const { name } = examObj
  return new Promise((resolve, reject) => {
    db.update({ name }, { ...examObj }, {}, (err, doc) => {
      if (err) reject(err)
      resolve(doc)
    })
  })
}

export const save_exam = async (db, exam) => {
  try {
    await item_exists(db, exam.name)
    return update_exam(db, exam)
  } catch (error) {
    return new_item(db, exam)
  }
}
export const get_or_create_db = filename => {
  return new Datastore({
    filename,
    autoload: true,
    timestampData: true
  })
}

export const initial_state = async db => {
  try {
    const default_exam = await get_item(db, { name: 'default_exam' })
    const setting = await get_setting(db)
    const projects = (await get_projects(db)) || []
    return { default_exam, setting, projects }
  } catch (error) {
    const setting = { name: 'setting', ...settings }
    const default_exam = {
      name: 'default_exam',
      exam: {
        codes: [],
        config,
        settings
      },
      examPartials: partials
    }
    await save_exam(db, default_exam)
    await set_setting(db, setting)
    return { default_exam, setting }
  }
}

const shuffle_options = qs => {
  return qs.map(val => {
    const shffledOrder = shuffle(val.options.filter(v2 => v2.pinned === false).map(v3 => v3.order))
    let index = 0
    const options = val.options.map(o => {
      let order = o.order
      if (o.pinned === false) {
        order = shffledOrder[index]
        index++
      }
      return { ...o, order }
    })

    return {
      ...val,
      options: options.sort((a, b) => {
        return a.order > b.order ? 1 : -1
      })
    }
  })
}
const shuffle_questions_ingroups = (qs, groups) => {
  const groupLimits = [
    0,
    ...groups.map((g, i) => {
      const count = [...groups.filter((gg, ii) => ii <= i)].reduce((a, b) => a + parseInt(b.noq), 0)
      return count
    })
  ]
  const questions = new Array(groups.length).fill(0, 0, groups.length).map((z, i) => {
    return shuffle(qs.slice(groupLimits[i], groupLimits[i + 1]))
  })
  let tempQs = []
  groups.forEach((v, i) => {
    tempQs = [...tempQs, ...questions[i]]
  })
  return tempQs
}
export const shuffle_exam = obj => {
  const { config, codes } = obj
  const { numOfVersions, examGroups } = config
  const versions = new Array(numOfVersions).fill(0, 0, numOfVersions).map((val, i) => {
    const versionName = 'CODE' + String(100 + i + 1).substr(1, 2)
    const qs = shuffle_options(codes[0].questions)
    const questions = shuffle_questions_ingroups(qs, examGroups)
    return {
      ...codes[0],
      questions,
      versionName,
      master: false
    }
  })

  return { ...obj, codes: [...codes, ...versions] }
}

// exm->partials -> partials
/*const placeHolder = `
\\begin{tabular}{|c||c|c|c|c|c|c|}
\\hline
V & a & b & c & d & e \\\\ \\hline 
1 & 4 & 2 & 3 & 9 & 2 \\\\ \\hline
2 & 2 & 4 & 7 & 3 & 4 \\\\ \\hline
3 & 3 & 3 & 4 & 7 & 3 \\\\ \\hline
4 & 2 & 6 & 3 & 2 & 7 \\\\ \\hline
\\end{tabular}
`
*/
const alphabets = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']
export const add_answer_key = (exam, partials) => {
  const {
    config: { numOfQuestions, numOfVersions },
    codes
  } = exam
  const numOfCodes = codes.length
  const tableHeader =
    '|c||' +
    new Array(numOfCodes)
      .fill(0, 0, numOfCodes)
      .map(() => {
        return 'c'
      })
      .join('|') +
    '| \n'
  let tableRows =
    'Q & MASTER &' +
    new Array(numOfVersions)
      .fill(0, 0, numOfVersions)
      .map((v, i) => {
        return 'CODE' + String(100 + i + 1).substr(1, 2)
      })
      .join('&') +
    ' \\\\ \\hline \n'
  const qIterators = new Array(numOfQuestions).fill(0, 0, numOfQuestions)
  qIterators.forEach((v, i) => {
    tableRows +=
      `${i + 1} & ` +
      new Array(numOfCodes)
        .fill(0, 0, numOfCodes)
        .map((v2, ii) => {
          return alphabets[codes[ii].questions[i].options.filter(o => o.correct === true)[0].order]
        })
        .join('&') +
      '\\\\ \\hline \n'
  })

  let table = `
  \\begin{tabular}{${tableHeader}}
  \\hline
  ${tableRows}
  \\end{tabular}
    `
  return {
    ...partials,
    answerkey: answerkey(table)
  }
}

export const add_answer_counts = (exam, partials) => {
  const {
    config: { numOfAnswers, numOfVersions },
    codes
  } = exam
  const tableHeader =
    '|c||' +
    new Array(numOfAnswers)
      .fill(0, 0, numOfAnswers)
      .map(() => {
        return 'c'
      })
      .join('|') +
    '| \n'
  let tableRows =
    'V & ' +
    new Array(numOfAnswers)
      .fill(0, 0, numOfAnswers)
      .map((v, i) => {
        return alphabets[i]
      })
      .join('&') +
    ' \\\\ \\hline \n'

  const qIterators = new Array(numOfVersions).fill(0, 0, numOfVersions)
  qIterators.forEach((v, i) => {
    tableRows +=
      `${i + 1} & ` +
      new Array(numOfAnswers)
        .fill(0, 0, numOfAnswers)
        .map((v2, ii) => {
          return codes[i + 1].questions.reduce((a, b) => {
            if (b.options.filter(oo => oo.correct === true)[0].order === ii) {
              return a + 1
            } else {
              return a
            }
          }, 0)
        })
        .join('&') +
      '\\\\ \\hline \n'
  })

  let table = `
  \\begin{tabular}{${tableHeader}}
  \\hline
  ${tableRows}
  \\end{tabular}
    `
  return {
    ...partials,
    answercount: answercount(table)
  }
}

-----



vue.config
module.exports = {
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        // options placed here will be merged with default configuration and passed to electron-builder
        appId: 'mshahrani.shuffler.app',
        productName: 'Shuffler',
        icon: './src/assets/icon.png',
        win: {
          target: [
            {
              target: 'nsis',
              arch: ['x64', 'ia32']
            }
          ]
        },
        nsis: {
          oneClick: false,
          allowToChangeInstallationDirectory: true
        },

        publish: {
          provider: 'github',
          owner: 'mmogib',
          repo: 'exam_shuffler_v2',
          vPrefixedTagName: true,
          //token: process.env.GH_TOKEN,
          //private: true,
          releaseType: 'release',
          publishAutoUpdate: true
        }
      }
    }
  }
}
