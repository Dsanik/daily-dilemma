import type { Story } from '../../types'

export const wrongErrorStory: Story = {
  id: 'story-wrong-error',
  slug: 'wrong-error',
  title: 'Цена чужой ошибки',
  subtitle: 'Ошибка коллеги на энергообъекте',
  coverColor: '#dc2626',
  category: 'work',
  initialVariables: {
    friendStatus: 'unknown',
    systemFailed: false,
    storyLeaked: false,
    reputation: 5,
    igorAttitude: 'neutral',
  },
  chapters: [
    // ═══════════════════════════════════════════
    // ГЛАВА 1. ИНВАРИАНТНЫЙ СТАРТ
    // ═══════════════════════════════════════════
    {
      id: 'ch-1',
      index: 1,
      title: 'Глава 1. Тишина перед комиссией',
      subtitle: 'Пять минут до обхода',
      start: 'narr_1',
      defaultIntro:
        'Подстанция. Ночная смена. Комиссия по безопасности будет через пять минут.',
      nodes: {
        narr_1: {
          type: 'text',
          text: 'В воздухе пахнет озоном — как после грозы, но грозы не было. Только микроудар по оборудованию, который ушёл в отчёты автоматики.',
          next: 'narr_2',
        },
        narr_2: {
          type: 'text',
          text: 'Ты сидишь в операторской. Время 4:47. Автоматика сработала за 0,3 секунды до аварии. Спасла систему. Но не репутацию человека, который стоит за дверью.',
          next: 'door_opens',
        },
        door_opens: {
          type: 'dialogue',
          speaker: null,
          text: 'Дверь открывается без стука. Ты уже знаешь, кто это.',
          next: 'igor_entrance',
        },
        igor_entrance: {
          type: 'dialogue',
          speaker: 'Игорь',
          speakerColor: '#4a9eff',
          text: 'Не спишь?',
          next: 'igor_sits',
        },
        igor_sits: {
          type: 'dialogue',
          speaker: null,
          text: 'Он садится напротив — не спрашивая разрешения. Так делают люди, у которых больше нет сил держать спину.',
          next: 'igor_plea',
        },
        igor_plea: {
          type: 'dialogue',
          speaker: 'Игорь',
          speakerColor: '#4a9eff',
          text: 'Я перепутал ключи блокировки. Автоматика спасла, но микроудар уже зафиксирован. Если комиссия найдёт — уволят по статье. «Волчий билет». Ни одна организация не возьмёт. У меня ипотека, Оля не работает, у Кирюхи садик. Подтверди по протоколу, что это был плавающий сбой датчика. Логи совпадают по времени — система сожрёт версию.',
          next: 'hero_internal',
        },
        hero_internal: {
          type: 'dialogue',
          speaker: null,
          text: 'Ты смотришь на его руки. Они дрожат. Не от страха — от того, что он уже готов услышать «нет». И ты понимаешь, что сейчас скажешь что-то, что запомнится вам обоим на всю жизнь.',
          next: 'choice_1',
        },
        choice_1: {
          type: 'choice',
          text: 'Твой ответ?',
          options: [
            {
              id: 'cover',
              text: '«Ладно. Подпишу. Но ты мне должен — и это не про деньги.»',
              next: 'route_after_choice',
              sets: {
                friendStatus: 'saved',
                igorAttitude: 'grateful',
                reputation: 3,
              },
            },
            {
              id: 'report',
              text: '«Игорь. Ты знаешь, что я не могу. Я сдал реальный отчёт.»',
              next: 'route_after_choice',
              sets: {
                friendStatus: 'reported',
                igorAttitude: 'hostile',
                reputation: 8,
              },
            },
            {
              id: 'delegate',
              text: '«Иди к комиссии сам. Скажи всё как есть. Это твой единственный шанс.»',
              next: 'route_after_choice',
              sets: {
                friendStatus: 'delegated',
                igorAttitude: 'neutral',
                reputation: 6,
              },
            },
          ],
        },
        route_after_choice: {
          type: 'route',
          branches: [
            { if: { variable: 'friendStatus', equals: 'saved' }, next: 'after_cover' },
            { if: { variable: 'friendStatus', equals: 'reported' }, next: 'after_report' },
            { if: { variable: 'friendStatus', equals: 'delegated' }, next: 'after_delegate' },
          ],
          fallback: 'after_cover',
        },
        after_cover: {
          type: 'dialogue',
          speaker: 'Игорь',
          speakerColor: '#4a9eff',
          text: 'Спасибо.\n\nОн не говорит «я это запомню». Он просто смотрит на тебя — долго, секунды три.',
          next: 'chapter_end_cover',
        },
        after_report: {
          type: 'dialogue',
          speaker: 'Игорь',
          speakerColor: '#dc2626',
          text: 'Понятно.\n\nОн встаёт. Не смотрит на тебя. У двери оборачивается: «Я так и знал».',
          next: 'chapter_end_report',
        },
        after_delegate: {
          type: 'dialogue',
          speaker: 'Игорь',
          speakerColor: '#4a9eff',
          text: 'Ты думаешь, я смогу?\n\nОн замолкает. Потом кивает — сам себе.',
          next: 'chapter_end_delegate',
        },
        chapter_end_cover: {
          type: 'ending',
          text: 'Глава 1 закончена.',
          outcome: 'Покрыл друга',
        },
        chapter_end_report: {
          type: 'ending',
          text: 'Глава 1 закончена.',
          outcome: 'Сдал реальный отчёт',
        },
        chapter_end_delegate: {
          type: 'ending',
          text: 'Глава 1 закончена.',
          outcome: 'Игорь признался сам',
        },
      },
      final_stats_map: {
        cover: 'Покрыл друга',
        report: 'Сдал реальный отчёт',
        delegate: 'Игорь признался сам',
      },
    },

    // ═══════════════════════════════════════════
    // ГЛАВА 2. МОДУЛЬНАЯ — три ветки
    // ═══════════════════════════════════════════
    {
      id: 'ch-2',
      index: 2,
      title: 'Глава 2. Второй сбой',
      subtitle: 'Три дня спустя',
      start: 'route_to_branch',
      defaultIntro: 'Прошло три дня. Ночью сработала автоматика — на том же узле.',
      nodes: {
        route_to_branch: {
          type: 'route',
          branches: [
            { if: { variable: 'friendStatus', equals: 'saved' }, next: 'branch_A_narr' },
            { if: { variable: 'friendStatus', equals: 'reported' }, next: 'branch_B_narr' },
            { if: { variable: 'friendStatus', equals: 'delegated' }, next: 'branch_V_narr' },
          ],
          fallback: 'branch_A_narr',
        },

        // ─── ВЕТКА A. ПОКРЫЛ ───
        branch_A_narr: {
          type: 'dialogue',
          speaker: null,
          text: 'Игорь работает как обычно — может, чуть тише. Но ты чувствуешь: он ждёт, что ты снова его выручишь. Сегодня ночью — повторный сбой на том же узле.',
          next: 'common_choice',
        },

        // ─── ВЕТКА Б. СДАЛ ───
        branch_B_narr: {
          type: 'dialogue',
          speaker: null,
          text: 'Игоря нет. Ты на смене один. В операторской слишком тихо. Ночью — повторный сбой на том же узле. Ты понимаешь: это не разовая ошибка, а дефект системы.',
          next: 'common_choice',
        },

        // ─── ВЕТКА В. ДЕЛЕГИРОВАЛ ───
        branch_V_narr: {
          type: 'dialogue',
          speaker: null,
          text: 'Игорь на испытательном сроке. Он держится отдельно, не смотрит в глаза. Ночью — повторный сбой на том же узле. Комиссия уже ведёт расследование.',
          next: 'common_choice',
        },

        // ─── ОБЩИЙ ВЫБОР ───
        common_choice: {
          type: 'choice',
          text: 'Что делаешь со вторым сбоем?',
          options: [
            {
              id: 'escalate',
              text: '«Пишу докладную. Система важнее всего.»',
              next: 'route_after_system',
              sets: {
                systemFailed: true,
                reputation: 8,
              },
            },
            {
              id: 'silence',
              text: '«Промолчу. Пусть решают наверху.»',
              next: 'route_after_system',
              sets: {
                systemFailed: false,
                reputation: 3,
              },
            },
            {
              id: 'partial',
              text: '«Напишу обтекаемо — «рекомендую проверить узел».»',
              next: 'route_after_system',
              sets: {
                systemFailed: false,
                reputation: 5,
              },
            },
          ],
        },

        // ─── РЕАКЦИЯ ПО ВЕТКАМ ───
        route_after_system: {
          type: 'route',
          branches: [
            { if: { variable: 'systemFailed', equals: true }, next: 'react_escalate' },
            { if: { variable: 'systemFailed', equals: false }, next: 'route_silence_or_partial' },
          ],
          fallback: 'react_escalate',
        },
        route_silence_or_partial: {
          type: 'route',
          branches: [
            { if: { variable: 'reputation', equals: 5 }, next: 'react_partial' },
            { if: { variable: 'reputation', lt: 4 }, next: 'react_silence' },
          ],
          fallback: 'react_silence',
        },
        react_escalate: {
          type: 'dialogue',
          speaker: null,
          text: 'Ты нажимаешь «отправить». Докладная уходит в 5:12.\n\nУтром тебя вызывает главный инженер: «Хорошо, что заметили. Узел закроют на ремонт через месяц. Это может спасти кому-то жизнь».',
          next: 'chapter_end',
        },
        react_silence: {
          type: 'dialogue',
          speaker: null,
          text: 'Ты закрываешь лог.\n\nЧерез две недели — третий сбой. На этот раз без спасения: реальные повреждения. Служба безопасности начинает проверку.',
          next: 'chapter_end',
        },
        react_partial: {
          type: 'dialogue',
          speaker: null,
          text: 'Ты пишешь обтекаемую докладную. Узел ставят в план на следующий квартал. До этого момента он остаётся потенциально опасным.',
          next: 'chapter_end',
        },

        chapter_end: {
          type: 'ending',
          text: 'Глава 2 закончена.',
          outcome: 'Решение по второму сбою',
        },
      },
      final_stats_map: {
        escalate: 'Эскалация',
        silence: 'Молчание',
        partial: 'Полумера',
      },
    },

    // ═══════════════════════════════════════════
    // ГЛАВА 3. МОДУЛЬНАЯ — три ветки
    // ═══════════════════════════════════════════
    {
      id: 'ch-3',
      index: 3,
      title: 'Глава 3. Возвращение Игоря',
      subtitle: 'Неожиданный визит',
      start: 'route_to_branch',
      defaultIntro: 'Утро. Ты приходишь на работу.',
      nodes: {
        route_to_branch: {
          type: 'route',
          branches: [
            { if: { variable: 'friendStatus', equals: 'saved' }, next: 'branch_A_narr' },
            { if: { variable: 'friendStatus', equals: 'reported' }, next: 'branch_B_narr' },
            { if: { variable: 'friendStatus', equals: 'delegated' }, next: 'branch_V_narr' },
          ],
          fallback: 'branch_A_narr',
        },

        // ─── ВЕТКА A. ПОКРЫЛ → Игорь в кабинете, требует ещё ───
        branch_A_narr: {
          type: 'dialogue',
          speaker: null,
          text: 'Ты приходишь на работу. Игорь ждёт тебя у проходной. Он знает про второй сбой. И он хочет поговорить. Опять.',
          next: 'branch_A_igor',
        },
        branch_A_igor: {
          type: 'dialogue',
          speaker: 'Игорь',
          speakerColor: '#4a9eff',
          text: 'Слушай. Комиссия копает глубже. Если они вернутся к первому случаю — нас обоих вытащат. Помоги мне. Поручись за меня перед руководством. Или помоги уйти по-хорошему.',
          next: 'branch_A_choice',
        },
        branch_A_choice: {
          type: 'choice',
          text: 'Что делаешь?',
          options: [
            {
              id: 'guarantee',
              text: '«Ладно. Поручусь. Но это последний раз.»',
              next: 'branch_A_after',
              sets: {
                reputation: 2,
                igorAttitude: 'grateful',
              },
            },
            {
              id: 'help_exit',
              text: '«Помогу тебе уйти по-хорошему. Это лучшее, что я могу сделать.»',
              next: 'branch_A_after',
              sets: {
                reputation: 4,
                igorAttitude: 'neutral',
              },
            },
            {
              id: 'refuse',
              text: '«Игорь. Я больше не могу тебя вытаскивать. Это твоя жизнь, не моя.»',
              next: 'branch_A_after',
              sets: {
                reputation: 3,
                igorAttitude: 'hostile',
              },
            },
          ],
        },
        branch_A_after: {
          type: 'dialogue',
          speaker: null,
          text: 'Игорь кивает, не глядя на тебя. Уходит. Ты чувствуешь, что между вами что-то закончилось — но не понимаешь что.',
          next: 'chapter_end',
        },

        // ─── ВЕТКА Б. СДАЛ → Игорь приходит извне ───
        branch_B_narr: {
          type: 'dialogue',
          speaker: null,
          text: 'Ты приходишь на работу. У проходной стоит Игорь. Он вернулся из другого города — и он ждал именно тебя. Охрана его не пускает. Он машет тебе рукой.',
          next: 'branch_B_igor',
        },
        branch_B_igor: {
          type: 'dialogue',
          speaker: 'Игорь',
          speakerColor: '#dc2626',
          text: 'Я не в обиде. Правда. Ты поступил как должен был. Но у меня к тебе дело — не про работу. Про жизнь. Оля ушла. Кирюха живёт с бабушкой. Я хочу знать — ты вообще думал о том, что делал, когда писал тот отчёт?',
          next: 'branch_B_choice',
        },
        branch_B_choice: {
          type: 'choice',
          text: 'Что отвечаешь?',
          options: [
            {
              id: 'defend',
              text: '«Да. Я думал. И поступил бы так же снова.»',
              next: 'branch_B_after',
              sets: {
                reputation: 7,
                igorAttitude: 'hostile',
              },
            },
            {
              id: 'apologize',
              text: '«Игорь. Прости. Я не знал, что так выйдет. Могу чем-то помочь?»',
              next: 'branch_B_after',
              sets: {
                reputation: 5,
                igorAttitude: 'neutral',
              },
            },
            {
              id: 'blame',
              text: '«Ты перепутал ключи. Это твоя ответственность, не моя.»',
              next: 'branch_B_after',
              sets: {
                reputation: 6,
                igorAttitude: 'hostile',
              },
            },
          ],
        },
        branch_B_after: {
          type: 'dialogue',
          speaker: null,
          text: 'Игорь молча уходит. Ты не знаешь, увидитесь ли вы ещё.',
          next: 'chapter_end',
        },

        // ─── ВЕТКА В. ДЕЛЕГИРОВАЛ → Игорь на испытательном, ищет союзника ───
        branch_V_narr: {
          type: 'dialogue',
          speaker: null,
          text: 'Ты приходишь на работу. Игорь на испытательном сроке, держится отдельно. Сегодня он подходит к тебе в курилке.',
          next: 'branch_V_igor',
        },
        branch_V_igor: {
          type: 'dialogue',
          speaker: 'Игорь',
          speakerColor: '#8b5cf6',
          text: 'Ты тогда дал мне шанс. Я его использовал. Но сейчас меня хотят сделать крайним за второй сбой — хотя это уже системная проблема. Мне нужна поддержка. Ты со мной или против меня?',
          next: 'branch_V_choice',
        },
        branch_V_choice: {
          type: 'choice',
          text: 'Что делаешь?',
          options: [
            {
              id: 'support',
              text: '«Я с тобой. Скажу руководству, что это не твоя вина.»',
              next: 'branch_V_after',
              sets: {
                reputation: 4,
                igorAttitude: 'neutral',
              },
            },
            {
              id: 'neutral',
              text: '«Я не буду вмешиваться. Разбирайся сам.»',
              next: 'branch_V_after',
              sets: {
                reputation: 5,
                igorAttitude: 'neutral',
              },
            },
            {
              id: 'against',
              text: '«Игорь. Если ты снова накосячил — я скажу правду.»',
              next: 'branch_V_after',
              sets: {
                reputation: 7,
                igorAttitude: 'hostile',
              },
            },
          ],
        },
        branch_V_after: {
          type: 'dialogue',
          speaker: null,
          text: 'Игорь слушает тебя, кивает. Но что именно он услышал — ты не знаешь.',
          next: 'chapter_end',
        },

        chapter_end: {
          type: 'ending',
          text: 'Глава 3 закончена.',
          outcome: 'Разговор с Игорем',
        },
      },
      final_stats_map: {
        // Для A
        guarantee: 'Поручился',
        help_exit: 'Помог уйти',
        refuse: 'Отказал',
        // Для Б
        defend: 'Защитил решение',
        apologize: 'Извинился',
        blame: 'Обвинил',
        // Для В
        support: 'Поддержал',
        neutral: 'Остался в стороне',
        against: 'Пошёл против',
      },
    },

    // ═══════════════════════════════════════════
    // ГЛАВА 4. ТОЧКА СХОЖДЕНИЯ + ФИНАЛ
    // ═══════════════════════════════════════════
    {
      id: 'ch-4',
      index: 4,
      title: 'Глава 4. Финальная комиссия',
      subtitle: 'Месяц спустя',
      start: 'funnel_act3',
      defaultIntro: '',
      nodes: {
        // ─── FUNNEL. Точка схождения всех трёх веток ───
        funnel_act3: {
          type: 'funnel',
          title: 'Акт 3. Кабинет финальной комиссии',
          textByCondition: [
            {
              if: { variable: 'friendStatus', equals: 'saved' },
              then: 'Месяц спустя. Расширенная комиссия. На столе — четыре папки. Одна с твоим протоколом от той ночи. Они знают, что ты покрыл коллегу. Вопрос — что ты скажешь сейчас.',
            },
            {
              if: { variable: 'friendStatus', equals: 'reported' },
              then: 'Месяц спустя. Расширенная комиссия. На столе — четыре папки. Одна с твоим отчётом от той ночи. Они знают, что ты сдал коллегу. Но кто-то прислал анонимку с вопросами к тебе.',
            },
            {
              if: { variable: 'friendStatus', equals: 'delegated' },
              then: 'Месяц спустя. Расширенная комиссия. На столе — четыре папки. Одна с показаниями Игоря. Он признался сам — но теперь комиссия не уверена, что ты не знал раньше.',
            },
          ],
          defaultText:
            'Месяц спустя. Расширенная комиссия. На столе — четыре папки. Одна с твоей фамилией.',
          next: 'route_to_finale_intro',
        },

        // ─── Вступление главы 4 по веткам ───
        route_to_finale_intro: {
          type: 'route',
          branches: [
            { if: { variable: 'friendStatus', equals: 'saved' }, next: 'intro_saved' },
            { if: { variable: 'friendStatus', equals: 'reported' }, next: 'intro_reported' },
            { if: { variable: 'friendStatus', equals: 'delegated' }, next: 'intro_delegated' },
          ],
          fallback: 'intro_saved',
        },
        intro_saved: {
          type: 'text',
          text: 'Тебя вызывают последним. Главный инженер кладёт перед собой тот самый протокол с твоей подписью. «Расскажите, что произошло в ночь на четвёртое число».',
          next: 'question_final',
        },
        intro_reported: {
          type: 'text',
          text: 'Тебя вызывают последним. Главный инженер кладёт перед собой твой отчёт. «Нам поступила анонимка с вопросами к вам. Кто-то считает, что вы знали больше, чем написали».',
          next: 'question_final',
        },
        intro_delegated: {
          type: 'text',
          text: 'Тебя вызывают последним. Главный инженер кладёт перед собой показания Игоря. «Он признался сам. Но мы не понимаем — почему вы молчали три дня, если всё знали».',
          next: 'question_final',
        },

        // ─── Финальный выбор ───
        question_final: {
          type: 'dialogue',
          speaker: 'Главный инженер',
          speakerColor: '#8b5cf6',
          text: 'Игорь Ковалёв — вы не хотите дополнить что-либо к его показаниям?',
          next: 'hero_internal',
        },
        hero_internal: {
          type: 'dialogue',
          speaker: null,
          text: 'Один вопрос. Одна секунда. Ты понимаешь, что от этого ответа зависит всё — и что это последняя развилка этой истории.',
          next: 'choice_final',
        },
        choice_final: {
          type: 'choice',
          text: 'Твой ответ?',
          options: [
            {
              id: 'tell_all',
              text: '«Да. Я знал всё с самого начала. И я принимал решения, о которых теперь жалею.»',
              next: 'route_finale',
              sets: { storyLeaked: true },
            },
            {
              id: 'hold',
              text: '«Мне нечего добавить. Всё изложено в документах.»',
              next: 'route_finale',
              sets: { storyLeaked: false },
            },
            {
              id: 'redirect',
              text: '«Это уже неважно. Узел — системная проблема. Обсуждать нужно её.»',
              next: 'route_finale',
              sets: { storyLeaked: false },
            },
          ],
        },

        // ─── Развилка к финалам ───
        route_finale: {
          type: 'route',
          branches: [
            // 1. Честный путь: сдал + эскалировал + признался + репутация ≥ 6
            {
              if: { variable: 'friendStatus', equals: 'reported' },
              next: 'check_honest',
            },
            // 2. Прагматик: делегировал + эскалировал + репутация ≥ 6
            {
              if: { variable: 'friendStatus', equals: 'delegated' },
              next: 'check_pragmatic',
            },
            // 3. Сломленный: репутация ≤ 2
            {
              if: { variable: 'reputation', lt: 3 },
              next: 'final_broken',
            },
            // 4. Трагический: покрыл + не эскалировал
            {
              if: { variable: 'friendStatus', equals: 'saved' },
              next: 'check_tragic',
            },
          ],
          fallback: 'final_irony',
        },

        // ─── Проверки комбинаций ───
        check_honest: {
          type: 'route',
          branches: [
            {
              if: { variable: 'systemFailed', equals: true },
              next: 'final_honest',
            },
          ],
          fallback: 'final_irony',
        },
        check_pragmatic: {
          type: 'route',
          branches: [
            {
              if: { variable: 'systemFailed', equals: true },
              next: 'final_pragmatic',
            },
          ],
          fallback: 'final_irony',
        },
        check_tragic: {
          type: 'route',
          branches: [
            {
              if: { variable: 'systemFailed', equals: false },
              next: 'final_tragic',
            },
          ],
          fallback: 'final_redemption',
        },

        // ─── Шесть финалов ───
        final_honest: {
          type: 'ending',
          text: 'Ты рассказываешь всё. Комиссия молчит. Главный инженер закрывает папку: «Спасибо, что нашли в себе силы». Тебя понизили в должности, но не уволили. Через год — снова повысили. Это был самый честный год в твоей карьере.',
          outcome: 'Честный путь',
        },
        final_pragmatic: {
          type: 'ending',
          text: 'Ты держишь линию: ошибка была, но система требовала починки — и ты её починил. Комиссия принимает. Игоря оставляют на испытательном, ты сохраняешь работу. Никто не выиграл. Но никто и не проиграл.',
          outcome: 'Прагматик',
        },
        final_tragic: {
          type: 'ending',
          text: 'Ты покрыл друга — и промолчал про системную проблему. Третий сбой случился через два месяца. Реальные повреждения, расследование. Тебя уволили первым. Игорь уехал из города. Ты потерял и работу, и друга.',
          outcome: 'Трагический компромисс',
        },
        final_irony: {
          type: 'ending',
          text: 'Ты пытался всех спасти. Игорь вернулся, система уцелела, но ты остался крайним — комиссия не оценила ни твоих усилий, ни твоих компромиссов. Через год ты ушёл сам — и стал консультантом по безопасности.',
          outcome: 'Ирония',
        },
        final_broken: {
          type: 'ending',
          text: 'Репутация подорвана. Комиссия не поверила ни одному твоему слову. Тебя перевели в архив — без права работы на объектах. Ты сидишь и думаешь: «Может, надо было иначе». Но уже поздно.',
          outcome: 'Сломленный',
        },
        final_redemption: {
          type: 'ending',
          text: 'Ты покрыл Игоря, потом отказал ему, когда он вернулся. И теперь — признался комиссии. Странная последовательность. Но именно она спасла: тебя не повысили, не уволили, не простили. Но и не покарали. Ты просто остался.',
          outcome: 'Искупление',
        },
      },
      final_stats_map: {
        tell_all: 'Признался',
        hold: 'Держал версию',
        redirect: 'Перевёл тему',
      },
    },
  ],

  // ─── Финальные концовки (по комбинациям) ───
  finales: [
    {
      id: 'f-honest',
      title: 'Честный путь',
      description:
        'Ты сдал коллегу, эскалировал проблему и признался комиссии. Ты потерял друга, но сохранил репутацию и здоровье системы.',
      conditions: [
        { variable: 'friendStatus', equals: 'reported' },
        { variable: 'systemFailed', equals: true },
        { variable: 'storyLeaked', equals: true },
        { variable: 'reputation', gt: 5 },
      ],
      color: '#16a34a',
    },
    {
      id: 'f-pragmatic',
      title: 'Прагматик',
      description:
        'Ты отправил коллегу к комиссии сам, эскалировал проблему и держал линию. Игорь ушёл, система починена. Ты сохранил работу и совесть.',
      conditions: [
        { variable: 'friendStatus', equals: 'delegated' },
        { variable: 'systemFailed', equals: true },
        { variable: 'reputation', gt: 5 },
      ],
      color: '#4a9eff',
    },
    {
      id: 'f-tragic',
      title: 'Трагический компромисс',
      description:
        'Ты покрыл друга, но не решил системную проблему. Третий сбой всё разрушил. Ты потерял и работу, и друга.',
      conditions: [
        { variable: 'friendStatus', equals: 'saved' },
        { variable: 'systemFailed', equals: false },
      ],
      color: '#dc2626',
    },
    {
      id: 'f-irony',
      title: 'Ирония',
      description:
        'Ты пытался всех спасти. Игорь вернулся, система уцелела, но ты остался крайним. Через год ты ушёл сам — и стал консультантом по безопасности.',
      conditions: [{ variable: 'storyLeaked', equals: false }],
      color: '#8b5cf6',
    },
    {
      id: 'f-broken',
      title: 'Сломленный',
      description:
        'Репутация подорвана. Комиссия не поверила ни одному твоему слову. Тебя перевели в архив — без права работы на объектах.',
      conditions: [{ variable: 'reputation', lt: 3 }],
      color: '#991b1b',
    },
    {
      id: 'f-redemption',
      title: 'Искупление',
      description:
        'Странная последовательность решений — и именно она тебя спасла. Тебя не повысили, не уволили, не простили. Но и не покарали.',
      conditions: [
        { variable: 'friendStatus', equals: 'saved' },
        { variable: 'storyLeaked', equals: true },
      ],
      color: '#0891b2',
    },
  ],
}