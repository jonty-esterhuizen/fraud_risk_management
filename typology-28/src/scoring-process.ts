import async from 'async';
import * as kafka from 'kafka-node';
import { RedisClient } from 'redis';
import rules from './rules';
import { publish } from './producer';
import { get } from './redis-client';
import { log } from './helper';

class typology27Type {
  rule9: boolean | undefined;
  rule12: boolean | undefined;
  rule14: boolean | undefined;
  rule18: boolean | undefined;
  rule30: boolean | undefined;
  rule32: boolean | undefined;
  rule78: boolean | undefined;
}

// Composed probability for typology 27 = (009.p)*(012.p)*(014.p+018.p+030.p+032.p+078.p)
const handleScores = (scores: any, topic: string, TransactionID: string) => {
  const score =
    (scores.rule9 ? 1 : 0)
    * (scores.rule12 ? 1 : 0)
    * (
      (scores.rule14 ? 0.2 : 0)
      + (scores.rule18 ? 0.2 : 0)
      + (scores.rule30 ? 0.2 : 0)
      + (scores.rule32 ? 0.2 : 0)
      + (scores.rule78 ? 0.2 : 0)
    );

  publish(topic, `[typology-27][${TransactionID}][${score}] Typology 27 score is ${score}, Reason: ${(scores.rule9 ? 'Recent Sim Swap, ' : '')
    + (scores.rule12 ? 'Party Type Individual, ' : '')
    + (scores.rule14 ? 'Recent Password Reset, ' : '')
    + (scores.rule18 ? 'Exceptionally Large Transfer, ' : '')
    + (scores.rule30 ? 'New Payee, ' : '')
    + (scores.rule32 ? 'Account Drain, ' : '')
    + (scores.rule78 ? 'Cash Withdrawal,' : '')
    }`);
}

const handleQuoteMessage = async (
  message: kafka.Message,
  topic: string,
  client: RedisClient,
) => {
  try {
    const transfer = JSON.parse(message.value.toString());
    const { TransactionID, ILPSourceAccountAddress } = transfer;

    const ILPList = await get(client, ILPSourceAccountAddress);
    const historicalData = JSON.parse(ILPList);
    const scores: typology27Type = new typology27Type();

    try { scores.rule32 = rules.handleBenfordsLaw(transfer, historicalData); } catch (error) {
      log(`Error while handling Benfords Law for transaction ${TransactionID}, with message: \r\n${error}`, topic)
    }
    handleScores(scores, topic, TransactionID);
  } catch (e) {
    console.error(e);
  }
};


export default handleQuoteMessage;
