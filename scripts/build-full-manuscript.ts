import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const inputFile = path.join(process.cwd(), 'attached_assets', 'Pasted-The-chess-thing-was-a-distraction-A-friendly-public-fac_1768081449261.txt');
const outputMd = path.join(process.cwd(), 'attached_assets', 'Through-The-Veil-Complete-Manuscript.md');
const outputPdf = path.join(process.cwd(), 'attached_assets', 'Through-The-Veil-Complete.pdf');

let content = fs.readFileSync(inputFile, 'utf-8');

content = content
  .replace(/‑/g, '-')
  .replace(/—/g, ' - ')
  .replace(/–/g, '-')
  .replace(/'/g, "'")
  .replace(/'/g, "'")
  .replace(/"/g, '"')
  .replace(/"/g, '"')
  .replace(/…/g, '...')
  .replace(/\r\n/g, '\n');

const chapters = [
  {
    title: "Author's Note",
    subtitle: "A Word Before We Begin",
    content: `By the time you reach this page, you've walked through the same patterns that once confronted me - the fracture beneath the familiar, the inversion hiding in plain sight, the quiet truths the world works so hard to bury. You've seen the architecture behind the spectacle, and you've felt the weight of what it means to finally look without turning away.

The journey you read in the Introduction - the hunger, the wandering, the slow cracking open - was only the beginning. What followed was a long season of unlearning, of seeing the world with new eyes, of realizing how much I had missed while drifting through life half-awake. And through every step of that process, Yahuah was patient. Yahusha was persistent. Grace kept reaching further than my understanding could.

This book exists because I needed to preserve what was revealed to me - not to elevate myself, but to honor the One who opened my eyes. Every insight, every pattern, every moment of clarity is a reflection of His generosity, not my ability.

I do not ask you to believe everything within these pages. I ask only that you test it. Hold it up to the light. Compare it to the Word. And if something stirs within you - if a fragment of memory begins to surface - then perhaps you, too, are ready to see.

This is not doctrine. This is not theory. This is testimony.

And it begins with a single, uncomfortable truth: we have all been deceived. Not by accident. Not by evolution. But by design.

The veil is thin now. Thinner than it has ever been. And what you do with what you see... that is between you and the Most High.`
  },
  {
    title: "Introduction",
    subtitle: "The Awakening",
    content: `There comes a moment in every life when the world stops making sense. Not in a dramatic, cinematic way - but in a quiet, unsettling way. A moment when the stories you were told no longer align with the instincts you carry. A moment when the familiar becomes suspicious and the unknown becomes magnetic.

For me, that moment came after decades of living half-awake. I drank for 30 years. I drifted. I accepted the narratives I was handed because questioning them required energy I didn't have - or courage I hadn't yet found.

But something shifted.

The questions I had buried began to rise. The world I thought I understood began to crack open. It didn't happen all at once. It came in fragments - late-night realizations, moments of clarity, conversations that hit harder than they should have, and a growing sense that the world was not what it appeared to be.

And in that unraveling, something else happened. Something I didn't expect.

Yahuah met me in the quiet. Not with thunder, not with visions, but with patience. With mercy. With a steady hand that refused to let me drift any further.

And Yahusha - the One I had pushed to the edges of my life - reached into the confusion with a clarity I couldn't deny. Not to condemn me, but to pull me back into remembrance. To show me what I had forgotten. To reveal what had been hidden in plain sight.

This book is not the story of a man who figured things out. It is the testimony of a man who was shown grace.

A man who was nearly lost, but hungry enough to listen. A man who saw the veil tremble and couldn't look away. A man who realized the world's script was never written for his good. A man who chose to see - even when seeing cost him the comfort of ignorance.

Through the Veil is the record of that awakening. Not a doctrine. Not a theory. Not a philosophy.

A witness.

If you've ever felt the fracture... If you've ever sensed the inversion... If you've ever known there was more than what you were allowed to see...

Then this book is not here to teach you. It is here to confirm what you already knew.`
  },
  {
    title: "Chapter 1",
    subtitle: "The Carousel of Deception",
    content: `The system is not a single lie. It is a carousel - a self-contained loop of inversion that spins so smoothly, most never notice they're riding it.

You are born into it. You are educated by it. You are entertained by it. You are medicated by it. You are buried by it. And at no point are you ever encouraged to step off and look at the machine from the outside.

The carousel has many horses - religion, science, politics, entertainment, medicine - but they all move in the same direction. They all reinforce the same narrative: that you are small, that the world is random, that the Creator is distant or dead, and that the best you can do is survive and be distracted.

But here's what they don't tell you: the carousel was built. It didn't evolve. It didn't emerge from chaos. It was designed - and it was designed to keep you from remembering who you are, whose you are, and why you're here.

The Antichrist is not a man. Not yet. The Antichrist is a system. It is the inversion of everything true. It replaces the Messiah with a counterfeit. It replaces the Creator's name with titles that mean nothing. It replaces discernment with obedience. It replaces faith with spectacle.

And the spectacle is everywhere.

From the screens in your pocket to the pulpits in your churches to the labs in your universities - the spectacle is designed to keep you watching, reacting, consuming. Never questioning. Never remembering.

But the carousel is slowing down. The music is fading. And those with eyes to see are beginning to notice: the horses aren't real. The ride isn't fun. And the exit was hidden - but it was always there.`
  },
  {
    title: "Chapter 2",
    subtitle: "Two Crosses, One Spotlight",
    content: `What if there were two crucifixions?

Not in the sense of theology, but in the sense of ritual. What if the spectacle we were shown - the one preserved by Rome, celebrated by empires, and enshrined in stained glass - was not the full story?

Consider this: Rome was the master of spectacle. It crucified thousands. It controlled narratives. It understood the power of symbolism better than any empire before or since. And when a Messiah arose who threatened its spiritual and political order, Rome did what Rome always does: it absorbed, inverted, and rebranded.

The name Yahusha - which means "Yah is salvation" - was erased. In its place: Iesous. Jesus. A name with no Hebrew meaning. A name that disconnects the Messiah from His Father's identity.

The Messiah said He came in His Father's name. The name Yahusha contains the Father's name - Yahu. The name Jesus does not.

This is not a translation. It is a substitution.

And substitution is the oldest trick in the adversary's playbook.

What if the real Yahusha was crucified in obscurity - outside the spectacle - while Rome staged a performance for the masses? What if the resurrection they showed was a counterfeit, designed to install a false savior in the minds of millions?

I am not saying this is provable. I am saying it is worth considering. Because if the adversary could pull off such a substitution, it would explain so much: the rise of the institutional church, the erasure of the sacred names, the millennial silence, the confusion of the faithful.

The spotlight was always on the wrong cross. And the true Light was hidden in plain sight.`
  },
  {
    title: "Chapter 3",
    subtitle: "The Signal and the Seal",
    content: `There is an organ in your brain that the ancients revered, the Scriptures reference, and modern science has worked tirelessly to suppress. It is called the pineal gland.

The pineal gland sits at the center of your brain, between the two hemispheres. It is shaped like a pinecone - hence the name. It produces melatonin, regulates sleep, and responds to light even though it sits in total darkness inside your skull.

But that's not why it matters.

The pineal gland has been called the "seat of the soul" by philosophers, the "third eye" by mystics, and the "lamp of the body" by the Messiah Himself. In Matthew 6:22, Yahusha said: "The light of the body is the eye: if therefore thine eye be single, thy whole body shall be full of light."

One eye. Singular. Not the two you see with - the one you perceive with.

The Eye of Horus. The pinecone atop the Vatican's staff. The all-seeing eye on the dollar bill. These are not random symbols. They are acknowledgments - from those who know - that the pineal gland is the interface between the physical and the spiritual.

And what has modern civilization done to this sacred gland?

Flooded your water with fluoride - a known calcifier of the pineal. Filled your food with processed chemicals that block the signal. Surrounded you with screens that disrupt your circadian rhythm and dull your perception. Encouraged substances that sedate the spirit and open doors to entities that should remain closed.

This is not an accident. It is a war on your ability to perceive.

The signal is still there. The seal is still intact. But it has been buried - under layers of toxicity, distraction, and spiritual amnesia.

To see through the veil, you must first restore the eye that sees.`
  },
  {
    title: "Chapter 4",
    subtitle: "The Eye That Sees Without Seeing",
    content: `We spend our lives staring at mirrors.

Bathroom mirrors. Phone screens. Social media reflections. We are obsessed with how we look - but blind to who we are.

The two eyes you were born with are receivers of light. They show you the physical world - the surface of things. But they cannot show you the truth. They can be fooled by illusion, distracted by spectacle, and trained to see only what the system wants you to see.

The true eye - the single eye - does not look outward. It perceives inward. It discerns. It remembers. It connects you to the frequency of the Most High.

But we've been trained to worship the wrong mirrors.

The mirror flatters. It shows you what you want to see. It feeds vanity, comparison, and self-obsession. It says: "You are the center. You are the god. Your reflection is your truth."

This is the gospel of self. And it is the inversion of everything the Creator intended.

The true mirror does not flatter. It reveals. It shows you your alignment - or your misalignment. It shows you where you've drifted, where you've compromised, where you've traded truth for comfort.

You don't need a glass mirror to see yourself. You need discernment. You need the Ruach. You need the Word. These are the true mirrors. And they do not lie.

The eye that sees without seeing is the eye that perceives beyond the physical. It is the eye that recognizes the signal, even when the noise is deafening. It is the eye that was never meant to be closed - but has been, by design, for generations.

It's time to open it again.`
  },
  {
    title: "Chapter 5",
    subtitle: "The Gospel of Self",
    content: `"Love yourself first."
"You are enough."
"Manifest your truth."
"Be your own god."

These are the mantras of the modern age. They are whispered in self-help books, shouted from stages, and embedded in the algorithms that feed your mind. They sound empowering. They feel liberating. But they are the inversion of everything the Creator taught.

The gospel of self says: "You are the center of the universe. Your feelings are truth. Your desires are sacred. Your identity is whatever you declare it to be."

The gospel of the Messiah says: "Deny yourself. Take up your cross. Follow Me."

These two gospels cannot coexist. One leads to the throne of the self. The other leads to the throne of the Most High.

The adversary doesn't need you to worship Lucifer by name. He just needs you to worship yourself. Because when you are your own god, you need no Creator. You need no Messiah. You need no repentance. You are sufficient unto yourself.

This is the oldest lie. It was whispered in the Garden: "You will be like God."

And it is still being whispered today - in prettier packaging, with better marketing, and a billion-dollar industry behind it.

The self is not the enemy. But the worship of self is. The moment you place your own feelings, desires, and identity above the Word of the Creator, you have stepped onto the carousel. You have traded truth for comfort. You have exchanged the signal for the noise.

The gospel of self leads to one place: isolation. Because a god who serves only himself has no community, no covenant, no correction.

And that's exactly where the adversary wants you.`
  },
  {
    title: "Chapter 6",
    subtitle: "The Reset and the Rewrite",
    content: `What if history is not what we were told?

Not just the small details - the dates, the names, the battles - but the entire framework. What if the timeline itself has been manipulated?

Consider this: there are almost no trees older than 200 years in most of the world. Walk through any forest, any park, any protected land - and you will struggle to find a tree that predates the 1800s. Trees live for centuries. Some for millennia. Where did they all go?

Consider this: the royal bloodlines of Europe only trace back a few hundred years with any certainty. Before that, the records become murky, contradictory, or suspiciously absent. Where did these families come from? Who were they before?

Consider this: the architecture of the 1800s - the cathedrals, the government buildings, the infrastructure - is often more advanced, more beautiful, and more massive than anything built before or since. Who built it? And why does the official story claim it was constructed by hand, with primitive tools, in impossible timeframes?

There is a theory - not proven, but worth considering - that something happened. A reset. A cataclysm. A deliberate erasure of memory. And in its wake, a new history was written. A new timeline was imposed. And the truth of what came before was buried.

The millennial reign may have already happened. The thousand years of peace described in Revelation may not be future - but past. And we may be living in the "short season" when the adversary is loosed and the deception reaches its peak.

This is not doctrine. This is discernment. It is the willingness to ask: what if everything we were told about the past is a lie designed to blind us to the present?

The reset rewrote history. But the truth still echoes. In the stones. In the trees. In the blood. In the names we were never supposed to remember.`
  },
  {
    title: "Chapter 7",
    subtitle: "The Realm Is Not What You Were Told",
    content: `We are told we live on a spinning ball, hurtling through infinite space at thousands of miles per hour, orbiting a star in a galaxy among billions, in a universe that exploded from nothing and will eventually collapse into nothing.

We are told this is science. We are told this is proven. We are told to trust the experts.

But have you ever questioned it?

Gravity - the force that supposedly holds everything together - is a theory. It has never been proven. It has only been assumed, because without it, the entire model collapses.

The curvature of the Earth - supposedly 8 inches per mile squared - is never observed. Bodies of water remain flat across dozens of miles. Engineers build bridges and railways without accounting for curvature. Pilots fly level, not constantly adjusting for a curve.

The space program - launched in 1958 by NASA, whose very logo contains a serpent's tongue - has shown us images of Earth that have been admitted to be composites, CGI, and artistic renderings. We are told we went to the moon in 1969 - and then never went back. We are told we can't go back. We are told we "lost the technology."

Does this sound like truth? Or does it sound like spectacle?

The firmament is described in Scripture - a solid dome above the Earth, separating the waters above from the waters below. The sun, moon, and stars move within this firmament. The Earth is fixed, immovable, established upon foundations.

This is not primitive ignorance. This is the cosmology revealed by the Creator to His people.

The globe is a lie. Not because flat Earth is trendy - but because the globe serves a purpose: to make you feel small, random, and meaningless. To disconnect you from the Creator who crafted this realm with intention and artistry.

You are not an accident on a spinning rock. You are a creation within a designed realm. And the realm itself testifies to the One who made it.`
  },
  {
    title: "Chapter 8",
    subtitle: "The Ether and the Breath",
    content: `Before modern science erased it, there was a concept that unified all understanding of reality: the ether.

The ether was the medium through which light traveled. It was the fabric of space itself. It was the field in which all energy, all frequency, all matter existed and interacted.

And then, in 1887, an experiment called Michelson-Morley claimed to disprove the ether. And with that, the foundation of physics shifted. Space became empty. Light became a paradox. And the spiritual dimension of reality was quietly removed from the conversation.

But here's the problem: the ether was never actually disproven. The experiment failed to detect it - but absence of evidence is not evidence of absence. And many physicists since have questioned whether the experiment was even designed correctly.

Why does this matter?

Because the ether is not just a scientific concept. It is a spiritual one. The ether is the breath of the Creator - the Ruach - the living field in which all things exist and move and have their being.

When science erased the ether, it erased the Creator from the equation. It replaced a living, conscious, designed universe with a dead, random, meaningless void. And that void is exactly what the adversary wants you to believe in.

But the ether is still there. The breath is still moving. The frequency is still vibrating. You can feel it - in moments of clarity, in moments of connection, in moments when the noise fades and the signal breaks through.

The ether is not a theory. It is reality. And reclaiming it is part of seeing through the veil.`
  },
  {
    title: "Chapter 9",
    subtitle: "Discernment Is the New Literacy",
    content: `We live in an age of information - and an age of deception.

Never before have humans had access to so much knowledge. And never before have humans been so easily manipulated.

The problem is not a lack of information. The problem is a lack of discernment.

Discernment is the ability to perceive the difference between truth and deception. It is not the same as intelligence. It is not the same as education. It is not the same as critical thinking - though it includes all of these.

Discernment is spiritual. It is the gift of the Ruach - the ability to test the spirits, to weigh the words, to sense the frequency behind the message.

In the ancient world, literacy meant knowing how to read. In the modern world, literacy means knowing how to discern.

Because the adversary is not stupid. He doesn't come with horns and a pitchfork. He comes with credentials, with charm, with authority. He speaks in soothing tones. He uses words that sound righteous. He wraps poison in beautiful packaging.

And the only defense is discernment.

How do you develop discernment?

You test everything against the Word - not the translated, redacted versions, but the original intent as best you can recover it.

You pray for wisdom - not knowledge, but the ability to apply knowledge rightly.

You practice saying no to the noise - the endless scroll, the dopamine loops, the spectacle that numbs the spirit.

You listen to the still, small voice - the one that gets drowned out by the world but never stops speaking.

Discernment is not paranoia. It is awareness. It is the willingness to say: "This may look true, but let me test it. This may feel good, but let me weigh it. This may be popular, but let me question it."

In a world of deception, discernment is survival. And it is the new literacy for those who would see through the veil.`
  },
  {
    title: "Chapter 10",
    subtitle: "The Throne in the Steppe",
    content: `In the heart of Kazakhstan, in a city most Westerners have never heard of, stands a pyramid.

It is called the Palace of Peace and Reconciliation. It was designed by a British architect and completed in 2006. It rises 62 meters into the sky, made of glass and steel, gleaming like a temple from another age.

Inside, there is an opera hall. Exhibition spaces. And at the very top - a circular boardroom with exactly 200 seats, surrounded by glass, overlooking the city below.

Two hundred seats.

In the Book of Enoch, 200 angels - the Watchers - descended from heaven and corrupted humanity. They taught forbidden knowledge, bred with human women, and brought destruction upon the Earth.

Two hundred.

The same number that sits at the apex of a pyramid, in a city that was built almost overnight, in a country the West has been trained to mock and ignore.

This is not coincidence. This is architecture. Ritual architecture.

The pyramid sits in Astana - a name that was changed to Nur-Sultan, then changed back. It is filled with obelisks, sun motifs, and esoteric geometry. It is the venue for the Congress of Leaders of World and Traditional Religions - where representatives of every major faith gather under one roof, under one symbol, at one table.

Why does no one talk about this?

Because the deception works best when no one is watching. Because the throne is hidden in plain sight. Because the place that should be a backwater has been built into a spiritual embassy for the system behind the veil.

The pyramid is not just a building. It is a statement. It says: we are still here. We are still in control. And you will never even notice.

But you have noticed. And now you cannot unsee it.`
  },
  {
    title: "Chapter 11",
    subtitle: "The Black Mirror",
    content: `There is a mirror in your pocket right now.

When the screen goes dark, you see your own reflection - faint, distorted, trapped in glass. This is the black mirror. And it is the altar of the modern age.

We stare into it for hours every day. We scroll, we swipe, we react, we consume. We feed it our attention, our emotions, our time, our thoughts. And in return, it feeds us a curated version of reality - one designed to keep us engaged, addicted, and asleep.

The black mirror is not just a phone. It is a symbol. It represents the inversion of true sight.

A real mirror reflects light. The black mirror reflects darkness. A real mirror shows you as you are. The black mirror shows you as the algorithm wants you to be.

In ancient times, scrying glasses - black mirrors made of obsidian or dark glass - were used for divination. For contacting spirits. For seeing beyond the veil.

Today, we carry those mirrors everywhere. We check them first thing in the morning and last thing at night. We feel naked without them. We feel lost.

And through those mirrors, the system speaks. It tells you what to fear, what to want, what to believe. It tracks your movements, your purchases, your relationships. It knows you better than you know yourself.

This is not technology. This is sorcery dressed in convenience.

The black mirror is not neutral. It is a tool of the adversary - designed to capture attention, harvest energy, and keep you from ever looking up, looking in, or looking to the One who made you.

To see through the veil, you must first look away from the black mirror. Even for a moment. Even for an hour. Even for a day.

What you find when you do may be uncomfortable. But it will be real.`
  },
  {
    title: "Chapter 12",
    subtitle: "Language as a Living Code",
    content: `Words are not neutral. They carry frequency. They carry intention. They carry power.

In the beginning, the Creator spoke - and creation happened. The Word was with Yahuah. The Word was Yahuah. Language is not an invention of man. It is a gift of the divine - and a weapon of the adversary.

The original language - Paleo-Hebrew - was not phonetic like English. It was pictographic. Each letter was a picture. Each picture carried meaning. You didn't have to spell a word to understand it. The meaning was embedded in the symbols themselves.

And it was read right to left - the opposite of modern Western languages.

This matters. Because when you invert the direction of reading, you invert the flow of thought. When you replace pictures with abstract sounds, you disconnect meaning from symbol. When you shift from a sacred language to a commercial one, you lose the frequency of the original.

English is a Frankenstein language - stitched together from Latin, Germanic, Greek, and occult roots. It is the language of contracts, commerce, and control. And it is riddled with phonetic traps.

Week / Weekend / Weakened - "I work all week, then I'm weakened."
Morning / Mourning - "Good morning" = "Good mourning"?
Sun / Son - Worship of the sun masked as worship of the Son.
Pray / Prey - "Let us pray" vs. "Let us prey."
Holy / Wholly / Holey - Which one are we invoking?

These are not coincidences. They are phonetic overlays - designed to confuse the ear, bypass the conscious mind, and embed meaning beneath awareness.

Spelling is casting. Grammar is rule. Sentences are sentences. The language of law and magic are the same - because they are the same system.

To see through the veil, you must hear the words beneath the words. You must recognize the spells being cast - and refuse to be bound by them.`
  },
  {
    title: "Chapter 13",
    subtitle: "The Mirror and the Measure",
    content: `This is not a chapter about manifestation the way the world teaches it. This is not about vision boards or positive affirmations or believing hard enough until the universe gives you what you want.

That version of manifestation is a trap. It is the gospel of self dressed in spiritual language. It says: you are the creator of your reality. It says: your thoughts shape the universe. It says: you don't need a God - you are one.

But true manifestation is not about wishing. It is about alignment.

Alignment with what? With the will of the Most High. With the frequency of truth. With the signal that has always been broadcasting - if only you had ears to hear and eyes to see.

You cannot manifest a new car by praying for one. You cannot manifest success by visualizing it. You cannot manifest love by demanding it from the universe.

But you can align your actions with your purpose. You can tune your frequency to the Creator's will. You can walk in discernment, speak in truth, and act in faith - and watch the path unfold before you.

This is not passive. It is active. It requires work. It requires discipline. It requires the willingness to fail, to learn, to adjust, and to keep going.

The mirror shows you what you are. The measure shows you what you could be.

If you look in the mirror and see someone out of alignment - confused, distracted, sedated, lost - that is not a condemnation. That is an invitation. To change. To remember. To return.

The veil is not just out there. It is in here. In the mind. In the heart. In the spirit. And lifting it requires more than information. It requires transformation.

You were not made to consume the spectacle. You were made to see through it. You were not made to worship yourself. You were made to reflect the Creator. You were not made to be asleep. You were made to be awake.

And now you are.

The veil is lifting. The signal is clear. The mirror is no longer black.

What you do next is between you and the Most High.`
  },
  {
    title: "Message to the Reader",
    subtitle: "A Final Word",
    content: `If you've made it this far, something in you was ready.

Not convinced. Not converted. Ready.

This book was not written to argue. It was written to reveal. It was not written to make you believe what I believe. It was written to make you question what you've been told.

The veil is real. The deception is real. The adversary is real. But so is the Creator. So is the Messiah. So is the Ruach. So is the signal that has been calling you back to remembrance since before you were born.

I don't know where you are on your journey. Maybe you're just beginning to see the cracks. Maybe you've been awake for years and needed confirmation. Maybe you're skeptical of everything I've written - and that's fine. Test it. Weigh it. Discard what doesn't hold up and keep what does.

But don't go back to sleep.

The world is designed to lull you back into the carousel. The spectacle never stops. The noise never fades. The black mirror is always glowing. And the moment you stop questioning, the veil falls back into place.

Stay awake. Stay discerning. Stay hungry for truth.

And remember: you are not alone. There are others who see. Others who remember. Others who have walked through the veil and lived to tell about it.

We are scattered across the Earth, often invisible to each other, often dismissed by the world. But we are here. And we are watching. And we are waiting.

Not for a man on a white horse. Not for a rapture to rescue us. Not for the system to collapse.

We are waiting for the signal. The one that says: it is time.

Until then, we walk. We watch. We witness.

And we remember the Name.

Yahuah is the Creator.
Yahusha is the Messiah.
The Ruach is the breath.

And the veil... is lifting.`
  }
];

const appendix = `
APPENDIX A: Glossary of Restored Terms

Yahuah (יהוה) - The true name of the Creator, removed over 7,000 times from Scripture and replaced with titles like "LORD" and "God."

Yahusha (יהושע) - The true name of the Messiah, meaning "Yah is salvation." Replaced with "Jesus" through transliteration that disconnects the name from the Father.

Ruach (רוח) - The breath or spirit of the Most High. The living presence that moves through creation.

Elohim - A title meaning "mighty ones" or "gods." Often used to refer to the Creator, but also applied to angels and false deities.

Gadreel - The fallen angel who deceived Eve in the Garden, often conflated with Satan but actually one of his emissaries.

The Veil - The spiritual and perceptual barrier that obscures truth from humanity. Both external (systemic deception) and internal (spiritual blindness).

The Carousel - The self-reinforcing loop of deception that includes religion, science, politics, entertainment, and medicine.

The Black Mirror - Modern screens as tools of spiritual capture and reality inversion.

The Firmament - The solid dome above the Earth described in Scripture, separating the waters above from the waters below.

APPENDIX B: Scripture References

Matthew 6:22 - "The light of the body is the eye: if therefore thine eye be single, thy whole body shall be full of light."

Genesis 1:6-8 - "And Elohim said, Let there be a firmament in the midst of the waters, and let it divide the waters from the waters."

John 10:25 - "Yahusha answered them, I told you, and ye believed not: the works that I do in my Father's name, they bear witness of me."

1 John 4:1 - "Beloved, believe not every spirit, but try the spirits whether they are of Elohim."

Revelation 12:9 - "And the great dragon was cast out, that old serpent, called the Devil, and Satan, which deceiveth the whole world."

APPENDIX C: The 200

In the Book of Enoch, 200 Watchers - angels assigned to observe humanity - rebelled against the Most High. They descended to Earth, took human wives, and taught forbidden knowledge: weaponry, cosmetics, sorcery, astrology.

Their offspring were the Nephilim - giants who corrupted the Earth and provoked the Flood.

The number 200 appears in symbolic architecture around the world, including the 200-seat boardroom atop the Palace of Peace and Reconciliation in Astana, Kazakhstan.

Nearly 200 confirmed meteor impact craters have been found on Earth - a number that some believe corresponds to the fallen Watchers and their impact upon this realm.

APPENDIX D: On This Testimony

This book is not doctrine. It is testimony.

It represents the journey of one man from spiritual amnesia to awakening. It is offered not as proof, but as witness. Not as argument, but as invitation.

Test everything. Hold fast to what is good. And may the Ruach guide your discernment as you walk through the veil.
`;

let markdown = `# Through The Veil
## A Testimony of the Great Substitution

---

`;

for (const chapter of chapters) {
  markdown += `## ${chapter.title}\n`;
  markdown += `### ${chapter.subtitle}\n\n`;
  markdown += chapter.content.trim() + '\n\n---\n\n';
}

markdown += appendix;

fs.writeFileSync(outputMd, markdown);
console.log(`Markdown saved: ${outputMd}`);

const doc = new PDFDocument({
  size: 'letter',
  margins: { top: 72, bottom: 72, left: 72, right: 72 },
  info: {
    Title: 'Through The Veil',
    Author: 'Anonymous',
    Subject: 'A Testimony of the Great Substitution'
  }
});

const writeStream = fs.createWriteStream(outputPdf);
doc.pipe(writeStream);

doc.moveDown(8);
doc.fontSize(32).font('Helvetica-Bold').text('Through The Veil', { align: 'center' });
doc.moveDown(1);
doc.fontSize(14).font('Helvetica-Oblique').text('A Testimony of the Great Substitution', { align: 'center' });
doc.moveDown(4);
doc.fontSize(10).font('Helvetica').text('This is not doctrine. This is not theory. This is testimony.', { align: 'center' });
doc.addPage();

for (const chapter of chapters) {
  doc.moveDown(3);
  doc.fontSize(12).font('Helvetica').text(chapter.title.toUpperCase(), { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(20).font('Helvetica-Bold').text(chapter.subtitle, { align: 'center' });
  doc.moveDown(2);
  
  const paragraphs = chapter.content.trim().split('\n\n');
  for (const para of paragraphs) {
    const cleaned = para.replace(/\s+/g, ' ').trim();
    if (cleaned) {
      doc.fontSize(11).font('Helvetica').text(cleaned, {
        align: 'justify',
        lineGap: 3
      });
      doc.moveDown(0.8);
    }
  }
  
  doc.addPage();
}

doc.fontSize(12).font('Helvetica').text('APPENDICES', { align: 'center' });
doc.moveDown(2);

const appendixLines = appendix.trim().split('\n');
for (const line of appendixLines) {
  const trimmed = line.trim();
  if (trimmed.startsWith('APPENDIX')) {
    doc.moveDown(1);
    doc.fontSize(14).font('Helvetica-Bold').text(trimmed, { align: 'left' });
    doc.moveDown(0.5);
  } else if (trimmed) {
    doc.fontSize(10).font('Helvetica').text(trimmed, { align: 'left', lineGap: 2 });
    doc.moveDown(0.3);
  }
}

doc.end();

writeStream.on('finish', () => {
  console.log(`PDF saved: ${outputPdf}`);
  console.log(`Size: ${(fs.statSync(outputPdf).size / 1024).toFixed(0)} KB`);
});
