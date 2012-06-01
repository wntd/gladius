document.addEventListener( "DOMContentLoaded", function( e ) {

  require.config({
    baseUrl: "../.."
  });
  
  require( 
    [ "gladius-core",
      "gladius-cubicvr",
      "gladius-box2d"],
    function( Gladius, cubicvrExtension, box2dExtension ) {

      var engine = new Gladius();

      // Engine monitor setup
      function monitor( engine ) {
        debugger;
        engine.detach( monitor );
      }
      document.addEventListener( "keydown", function( event ) {
        var code = event.which || event.keyCode;
        if( code === 0x4D && event.ctrlKey && event.altKey ) {
          engine.attach( monitor );
        }
      });

      var cubicvrOptions = {
        renderer: {
          canvas: document.getElementById( "test-canvas" )
        }
      };

      var box2dOptions = {
        resolver: {
          gravity: [0,-1]
        }
      };

      engine.registerExtension( cubicvrExtension, cubicvrOptions );
      engine.registerExtension( box2dExtension, box2dOptions);

      var resources = {};

      engine.get(
        [
          {
            type: engine["gladius-cubicvr"].Mesh,
            url: 'procedural-mesh.js',
            load: engine.loaders.procedural,
            onsuccess: function( mesh ) {
              resources.mesh = mesh;
            },
            onfailure: function( error ) {
            }
          },
          {
            type: engine["gladius-cubicvr"].MaterialDefinition,
            url: 'procedural-material.js',
            load: engine.loaders.procedural,
            onsuccess: function( material ) {
              resources.material = material;
            },
            onfailure: function( error ) {
            }
          }
        ],
        {
          oncomplete: game.bind( null, engine, resources )
        }
      );

  });

  function game( engine, resources ) {
    var space = new engine.simulation.Space();
    var cubicvr = engine.findExtension( "gladius-cubicvr" );
    var box2d = engine.findExtension( "gladius-box2d" );

    var lightDefinition = new cubicvr.LightDefinition({
      intensity: 2,
      light_type: cubicvr.LightDefinition.LightTypes.POINT,
      method: cubicvr.LightDefinition.LightingMethods.DYNAMIC
    });

    var bodyDefinition = new box2d.BodyDefinition();
    var fixtureDefinition = new box2d.FixtureDefinition({shape:new box2d.BoxShape()});

    space.add( new engine.simulation.Entity( "camera",
      [
        new engine.core.Transform( [0, 0, 0] ),
        new cubicvr.Light( lightDefinition ),
        new cubicvr.Camera( {
          targeted:false
        } )
      ]
    ));

    var xCoord, yCoord, zCoord;
    for (xCoord = -11; xCoord < 11; xCoord = xCoord + 2){
      for (yCoord = -11; yCoord < 11; yCoord = yCoord + 2){
        for (zCoord = -11; zCoord < 11; zCoord = zCoord + 2){
          space.add(new engine.simulation.Entity("cubex:" + xCoord + "y:" + yCoord + "z:" + zCoord,
            [
              new engine.core.Transform( [xCoord, yCoord, zCoord], [0, 0, 0], [ 0.1, 0.1, 0.1 ] ),
              new cubicvr.Model( resources.mesh, resources.material )
            ]
          ));
        }
      }
    }
    var parentCube = new engine.simulation.Entity( "cube",
      [
        new engine.core.Transform( [0, 0, -6], [0, 0, 0] ),
        new box2d.Body({bodyDefinition: bodyDefinition, fixtureDefinition: fixtureDefinition}),
        new cubicvr.Model( resources.mesh, resources.material )
      ]
    );
    space.add( parentCube );

//    var impEvent = new engine.Event('LinearImpulse',{impulse: [0, 5]});
//    impEvent.dispatch(parentCube);
//
//    var angEvent = new engine.Event('AngularImpulse',{impulse: 2});
//    angEvent.dispatch(parentCube);

    var task = new engine.FunctionTask( function() {
      var cubePosition = new engine.math.Vector3( space.findNamed( "cube").findComponent( "Transform").position);
      if (cubePosition[1] < -1.5){
        var impEvent = new engine.Event('LinearImpulse',{impulse: [0, 1]});
        impEvent.dispatch(parentCube);

        var angEvent = new engine.Event('AngularImpulse',{impulse: 0.1});
        angEvent.dispatch(parentCube);
      }
//      var cubeRotation = new engine.math.Vector3( space.findNamed( "cube" ).findComponent( "Transform" ).rotation );
//      cubeRotation = engine.math.vector3.add( cubeRotation, [0, space.clock.delta * 0.0003, 0] );
//      space.findNamed( "cube" ).findComponent( "Transform" ).setRotation( cubeRotation );
//
//      var cameraRotation = new engine.math.Vector3( space.findNamed( "camera" ).findComponent( "Transform" ).rotation );
//      cameraRotation = engine.math.vector3.add( cameraRotation, [0, space.clock.delta * 0.0003, 0] );
//      space.findNamed( "camera" ).findComponent( "Transform" ).setRotation( cameraRotation );
    }, {
      tags: ["@update"]
    });
    task.start();

    engine.resume();
  }

});