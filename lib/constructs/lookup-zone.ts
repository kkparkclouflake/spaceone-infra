import * as cdk from '@aws-cdk/core';
import * as route53 from '@aws-cdk/aws-route53';

import { DomainProps } from '../props/domain-props';

export class LookupZone extends cdk.Construct {
    public readonly domainProps: DomainProps;

    constructor(scope: cdk.Construct, id: string, domainName: string) {
        super(scope, id);
        
        // Determine HostedZone
        const hostedZone = route53.HostedZone.fromLookup(this, 'lookuped-zone', {
            domainName: domainName
        });

        this.domainProps = {
            'domainName': domainName,
            'hostedZone': hostedZone
        }
    }
}