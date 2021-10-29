import * as cdk from '@aws-cdk/core';
import * as route53 from '@aws-cdk/aws-route53';

import { DomainProps } from '../props/domain-props';

export class HostedZone extends cdk.Construct {
    public readonly domainProps: DomainProps;

    constructor(scope: cdk.Construct, id: string, domainName: string) {
        super(scope, id);
        
        // Determine HostedZone
        // 현재는 Lookup 실패시 그대로 작업 종료됨
        let hostedZone = route53.HostedZone.fromLookup(this, 'lookuped-zone', {
            domainName: domainName
        });

        // console.log(hostedZone);

        // Lookup 실패시 에러를 잡아서 Domain 생성토록?
        // if (!hostedZone) {
        //     hostedZone = new route53.PublicHostedZone(scope, 'created-zone', {
        //         zoneName: domainName
        //     });

        //     const hostedZoneNameServer = new cdk.CfnOutput(this, "hostedZoneNameServer", {
        //         value: hostedZone.hostedZoneNameServers?.join(', ')!,
        //     });
        // }

        this.domainProps = {
            'domainName': domainName,
            'hostedZone': hostedZone
        }
    }
}